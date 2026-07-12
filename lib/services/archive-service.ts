/**
 * Archive Service aligned with the current Prisma schema.
 * Persists folders, documents, and versions in PostgreSQL.
 */
import { Prisma } from '@prisma/client'
import { randomUUID } from 'crypto'
import { createAuditLog } from '@/lib/core/audit-engine'
import { hasHierarchyScopeAccess, type RBACUser } from '@/lib/core/rbac-engine'
import { getEntityBreadcrumb } from '@/lib/hierarchy-service'

export interface ArchiveFolderInput {
  name: string
  code: string
  description?: string
  hierarchyEntityId: string
  parentFolderId?: string
}

export interface ArchiveDocumentInput {
  title: string
  description?: string
  documentNumber: string
  folderId: string
  filePath: string
  mimeType: string
  fileSize: number
  tags?: string[]
  metadata?: Record<string, unknown>
}

export interface ArchiveSearchParams {
  query?: string
  folderId?: string
  hierarchyEntityId?: string
  tags?: string[]
  fromDate?: Date
  toDate?: Date
  page?: number
  pageSize?: number
}

type ArchiveFolderRecord = {
  id: string
  name: string
  code: string
  description?: string | null
  hierarchyEntityId: string
  parentFolderId: string | null
  createdAt: Date
  updatedAt: Date
}

type ArchiveDocumentVersionRecord = {
  version: number
  filePath: string
  fileSize: number
  mimeType: string
  uploadedById: string
  changes: string | null
  createdAt: Date
}

type ArchiveDocumentRecord = {
  id: string
  title: string
  description?: string | null
  documentNumber: string
  folderId: string
  filePath: string
  mimeType: string
  fileSize: number
  tags: string[]
  metadata?: Record<string, unknown> | null
  status: string
  archivedAt?: Date | null
  createdAt: Date
  updatedAt: Date
  versions: ArchiveDocumentVersionRecord[]
}

function now(): Date {
  return new Date()
}

function createId(prefix: string): string {
  return `${prefix}_${randomUUID()}`
}

async function resolveHierarchyEntity(hierarchyEntityId: string) {
  const breadcrumb = await getEntityBreadcrumb(hierarchyEntityId).catch(() => [])
  return breadcrumb.at(-1) ?? null
}

function buildFolderView(
  folder: ArchiveFolderRecord,
  childCount: number,
  documentCount: number,
  hierarchyEntity: Awaited<ReturnType<typeof resolveHierarchyEntity>>,
) {
  return {
    ...folder,
    _count: {
      documents: documentCount,
      childFolders: childCount,
    },
    hierarchyEntity,
  }
}

function buildDocumentView(
  document: ArchiveDocumentRecord,
  folder: ArchiveFolderRecord,
  hierarchyEntity: Awaited<ReturnType<typeof resolveHierarchyEntity>>,
) {
  return {
    ...document,
    folder: {
      id: folder.id,
      name: folder.name,
      hierarchyEntityId: folder.hierarchyEntityId,
      hierarchyEntity,
    },
    versions: document.versions
      .slice()
      .sort((a, b) => b.version - a.version)
      .map((version) => ({
        ...version,
        uploadedBy: {
          id: version.uploadedById,
          username: version.uploadedById,
          fullName: version.uploadedById,
        },
      })),
  }
}

async function folderMatchesScope(folder: ArchiveFolderRecord, user: RBACUser, hierarchyEntityId?: string): Promise<boolean> {
  if (user.role === 'SUPER_ADMIN') return true
  if (hierarchyEntityId) return folder.hierarchyEntityId === hierarchyEntityId
  return hasHierarchyScopeAccess(user, folder.hierarchyEntityId)
}

async function documentMatchesScope(document: ArchiveDocumentRecord, user: RBACUser, hierarchyEntityId?: string): Promise<boolean> {
  const folder = await import('@/lib/prisma').then(({ prisma }) =>
    prisma.archiveFolder.findUnique({ where: { id: document.folderId } }),
  )
  if (!folder) return false
  return folderMatchesScope(folder as ArchiveFolderRecord, user, hierarchyEntityId)
}

export async function createArchiveFolder(input: ArchiveFolderInput, userId: string) {
  const folder = await import('@/lib/prisma').then(({ prisma }) =>
    prisma.archiveFolder.create({
      data: {
        id: createId('af'),
        name: input.name,
        code: input.code,
        description: input.description ?? null,
        hierarchyEntityId: input.hierarchyEntityId,
        parentFolderId: input.parentFolderId || null,
      },
    }),
  )

  await createAuditLog({
    action: 'CREATE',
    entityType: 'ARCHIVE_FOLDER',
    entityId: folder.id,
    userId,
    details: {
      name: input.name,
      code: input.code,
      hierarchyEntityId: input.hierarchyEntityId,
    },
    hierarchyEntityId: input.hierarchyEntityId,
    hierarchyEntityType: 'ARCHIVE_FOLDER',
  })

  return folder
}

export async function getArchiveFolders(user: RBACUser, parentFolderId?: string, hierarchyEntityId?: string) {
  const { prisma } = await import('@/lib/prisma')
  const folders = await prisma.archiveFolder.findMany({
    where: {
      ...(parentFolderId !== undefined ? { parentFolderId } : { parentFolderId: null }),
    },
    orderBy: { name: 'asc' },
  })

  const scopedFolders: ArchiveFolderRecord[] = []
  for (const folder of folders) {
    if (await folderMatchesScope(folder as ArchiveFolderRecord, user, hierarchyEntityId)) {
      scopedFolders.push(folder as ArchiveFolderRecord)
    }
  }

  return Promise.all(
    scopedFolders.map(async (folder) => {
      const childCount = await prisma.archiveFolder.count({ where: { parentFolderId: folder.id } })
      const documentCount = await prisma.archiveDocument.count({ where: { folderId: folder.id } })
      const hierarchyEntity = await resolveHierarchyEntity(folder.hierarchyEntityId)
      return buildFolderView(folder, childCount, documentCount, hierarchyEntity)
    }),
  )
}

export async function getArchiveFolderById(folderId: string, user: RBACUser) {
  const { prisma } = await import('@/lib/prisma')
  const folder = await prisma.archiveFolder.findUnique({ where: { id: folderId } })
  if (!folder) return null
  if (!(await folderMatchesScope(folder as ArchiveFolderRecord, user))) return null

  const childFolders = await prisma.archiveFolder.findMany({
    where: { parentFolderId: folder.id },
    orderBy: { name: 'asc' },
  })

  const documents = await prisma.archiveDocument.findMany({
    where: { folderId: folder.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      versions: true,
    },
  })

  const hierarchyEntity = await resolveHierarchyEntity(folder.hierarchyEntityId)

  return {
    ...buildFolderView(folder as ArchiveFolderRecord, childFolders.length, documents.length, hierarchyEntity),
    childFolders: await Promise.all(
      childFolders.map(async (child) => {
        const childHierarchyEntity = await resolveHierarchyEntity(child.hierarchyEntityId)
        const childDocuments = await prisma.archiveDocument.count({ where: { folderId: child.id } })
        const childChildren = await prisma.archiveFolder.count({ where: { parentFolderId: child.id } })
        return buildFolderView(child as ArchiveFolderRecord, childChildren, childDocuments, childHierarchyEntity)
      }),
    ),
    documents: await Promise.all(
      documents.map(async (document) => {
        const folderHierarchyEntity = await resolveHierarchyEntity(folder.hierarchyEntityId)
        return buildDocumentView(
          {
            ...document,
            metadata: (document.metadata as Record<string, unknown> | null) ?? null,
            tags: document.tags || [],
            versions: document.versions.map((version) => ({
              version: version.version,
              filePath: version.filePath,
              fileSize: version.fileSize,
              mimeType: version.mimeType,
              uploadedById: version.uploadedById,
              changes: version.changes,
              createdAt: version.createdAt,
            })),
          },
          folder as ArchiveFolderRecord,
          folderHierarchyEntity,
        )
      }),
    ),
  }
}

export async function updateArchiveFolder(
  folderId: string,
  data: { name?: string; description?: string; parentFolderId?: string },
  userId: string,
) {
  const { prisma } = await import('@/lib/prisma')
  const folder = await prisma.archiveFolder.update({
    where: { id: folderId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.parentFolderId !== undefined ? { parentFolderId: data.parentFolderId } : {}),
    },
  })

  await createAuditLog({
    action: 'UPDATE',
    entityType: 'ARCHIVE_FOLDER',
    entityId: folderId,
    userId,
    details: data,
    hierarchyEntityId: folder.hierarchyEntityId,
    hierarchyEntityType: 'ARCHIVE_FOLDER',
  })

  return folder
}

export async function deleteArchiveFolder(folderId: string, userId: string) {
  const { prisma } = await import('@/lib/prisma')
  const folder = await prisma.archiveFolder.findUnique({ where: { id: folderId } })
  if (!folder) {
    throw new Error('المجلد غير موجود')
  }

  const hasDocuments = await prisma.archiveDocument.count({ where: { folderId } })
  const hasChildren = await prisma.archiveFolder.count({ where: { parentFolderId: folderId } })
  if (hasDocuments || hasChildren) {
    throw new Error('لا يمكن حذف مجلد غير فارغ. قم بنقل أو حذف المحتويات أولاً')
  }

  await prisma.archiveFolder.delete({ where: { id: folderId } })

  await createAuditLog({
    action: 'DELETE',
    entityType: 'ARCHIVE_FOLDER',
    entityId: folderId,
    userId,
    details: { name: folder.name, code: folder.code },
    hierarchyEntityId: folder.hierarchyEntityId,
    hierarchyEntityType: 'ARCHIVE_FOLDER',
  })

  return { success: true, message: 'تم حذف المجلد بنجاح' }
}

export async function createArchiveDocument(
  input: ArchiveDocumentInput,
  userId: string,
  uploadedById?: string,
) {
  const { prisma } = await import('@/lib/prisma')
  const folder = await prisma.archiveFolder.findUnique({ where: { id: input.folderId } })
  if (!folder) {
    throw new Error('المجلد غير موجود')
  }

  const document = await prisma.archiveDocument.create({
    data: {
      id: createId('ad'),
      title: input.title,
      description: input.description ?? null,
      documentNumber: input.documentNumber,
      folderId: input.folderId,
      filePath: input.filePath,
      mimeType: input.mimeType,
      fileSize: input.fileSize,
      tags: input.tags || [],
      metadata: (input.metadata || null) as Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput,
      versions: {
        create: [
          {
            id: createId('adv'),
            version: 1,
            filePath: input.filePath,
            fileSize: input.fileSize,
            mimeType: input.mimeType,
            uploadedById: uploadedById || userId,
            changes: 'النسخة الأصلية',
          },
        ],
      },
    },
    include: { versions: true },
  })

  await createAuditLog({
    action: 'CREATE',
    entityType: 'ARCHIVE_DOCUMENT',
    entityId: document.id,
    userId,
    details: {
      title: input.title,
      documentNumber: input.documentNumber,
      folderId: input.folderId,
      fileSize: input.fileSize,
    },
    hierarchyEntityId: folder.hierarchyEntityId,
    hierarchyEntityType: 'ARCHIVE_DOCUMENT',
  })

  return buildDocumentView(
    {
      ...document,
      metadata: document.metadata as Record<string, unknown> | null,
      tags: document.tags,
      versions: document.versions.map((version) => ({
        version: version.version,
        filePath: version.filePath,
        fileSize: version.fileSize,
        mimeType: version.mimeType,
        uploadedById: version.uploadedById,
        changes: version.changes,
        createdAt: version.createdAt,
      })),
    },
    folder as ArchiveFolderRecord,
    await resolveHierarchyEntity(folder.hierarchyEntityId),
  )
}

export async function getArchiveDocuments(params: ArchiveSearchParams, user: RBACUser) {
  const { prisma } = await import('@/lib/prisma')
  const page = params.page || 1
  const pageSize = params.pageSize || 20
  const skip = (page - 1) * pageSize

  const documents = await prisma.archiveDocument.findMany({
    where: {
      ...(params.folderId ? { folderId: params.folderId } : {}),
      ...(params.tags && params.tags.length > 0 ? { tags: { hasSome: params.tags } } : {}),
      ...(params.query
        ? {
            OR: [
              { title: { contains: params.query, mode: 'insensitive' } },
              { documentNumber: { contains: params.query, mode: 'insensitive' } },
              { description: { contains: params.query, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(params.fromDate || params.toDate
        ? {
            createdAt: {
              ...(params.fromDate ? { gte: params.fromDate } : {}),
              ...(params.toDate ? { lte: params.toDate } : {}),
            },
          }
        : {}),
    },
    include: {
      versions: true,
      folder: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  const filtered: typeof documents = []

  for (const document of documents) {
    if (!(await documentMatchesScope(document as ArchiveDocumentRecord, user, params.hierarchyEntityId))) continue
    filtered.push(document)
  }

  const data = await Promise.all(
    filtered.slice(skip, skip + pageSize).map(async (document) => {
      const folder = document.folder as unknown as ArchiveFolderRecord
      const hierarchyEntity = await resolveHierarchyEntity(folder.hierarchyEntityId)
      return buildDocumentView(
        {
          id: document.id,
          title: document.title,
          description: document.description,
          documentNumber: document.documentNumber,
          folderId: document.folderId,
          filePath: document.filePath,
          mimeType: document.mimeType,
          fileSize: document.fileSize,
          tags: document.tags,
          metadata: document.metadata as Record<string, unknown> | null,
          status: document.status,
          archivedAt: document.archivedAt,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt,
          versions: document.versions.map((version) => ({
            version: version.version,
            filePath: version.filePath,
            fileSize: version.fileSize,
            mimeType: version.mimeType,
            uploadedById: version.uploadedById,
            changes: version.changes,
            createdAt: version.createdAt,
          })),
        },
        folder,
        hierarchyEntity,
      )
    }),
  )

  return {
    data,
    total: filtered.length,
    page,
    pageSize,
    totalPages: Math.ceil(filtered.length / pageSize),
  }
}

export async function getArchiveDocumentById(documentId: string, user: RBACUser) {
  const { prisma } = await import('@/lib/prisma')
  const document = await prisma.archiveDocument.findUnique({
    where: { id: documentId },
    include: { versions: true, folder: true },
  })
  if (!document) return null

  const folder = document.folder as unknown as ArchiveFolderRecord
  const hasAccess = await hasHierarchyScopeAccess(user, folder.hierarchyEntityId)
  if (!hasAccess && user.role !== 'SUPER_ADMIN') {
    return null
  }

  return buildDocumentView(
    {
      id: document.id,
      title: document.title,
      description: document.description,
      documentNumber: document.documentNumber,
      folderId: document.folderId,
      filePath: document.filePath,
      mimeType: document.mimeType,
      fileSize: document.fileSize,
      tags: document.tags,
      metadata: document.metadata as Record<string, unknown> | null,
      status: document.status,
      archivedAt: document.archivedAt,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      versions: document.versions.map((version) => ({
        version: version.version,
        filePath: version.filePath,
        fileSize: version.fileSize,
        mimeType: version.mimeType,
        uploadedById: version.uploadedById,
        changes: version.changes,
        createdAt: version.createdAt,
      })),
    },
    folder,
    await resolveHierarchyEntity(folder.hierarchyEntityId),
  )
}

export async function addDocumentVersion(
  documentId: string,
  data: {
    filePath: string
    fileSize: number
    mimeType: string
    changes?: string
  },
  userId: string,
) {
  const { prisma } = await import('@/lib/prisma')
  const document = await prisma.archiveDocument.findUnique({ where: { id: documentId } })
  if (!document) {
    throw new Error('الوثيقة غير موجودة')
  }

  const lastVersion = await prisma.archiveDocumentVersion.findFirst({
    where: { documentId },
    orderBy: { version: 'desc' },
  })

  const newVersion = (lastVersion?.version || 0) + 1
  await prisma.archiveDocumentVersion.create({
    data: {
      id: createId('adv'),
      documentId,
      version: newVersion,
      filePath: data.filePath,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      uploadedById: userId,
      changes: data.changes || null,
    },
  })

  await prisma.archiveDocument.update({
    where: { id: documentId },
    data: {
      filePath: data.filePath,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      updatedAt: now(),
    },
  })

  const folder = await prisma.archiveFolder.findUnique({ where: { id: document.folderId } })
  if (folder) {
    await createAuditLog({
      action: 'UPDATE',
      entityType: 'ARCHIVE_DOCUMENT',
      entityId: documentId,
      userId,
      details: {
        action: 'NEW_VERSION',
        version: newVersion,
        changes: data.changes,
      },
      hierarchyEntityId: folder.hierarchyEntityId,
      hierarchyEntityType: 'ARCHIVE_DOCUMENT',
    })
  }

  return {
    version: newVersion,
    filePath: data.filePath,
    fileSize: data.fileSize,
    mimeType: data.mimeType,
    uploadedById: userId,
    changes: data.changes || null,
    createdAt: now(),
  } satisfies ArchiveDocumentVersionRecord
}

export async function archiveDocument(documentId: string, userId: string, hierarchyEntityId?: string) {
  const { prisma } = await import('@/lib/prisma')
  const document = await prisma.archiveDocument.update({
    where: { id: documentId },
    data: {
      status: 'ARCHIVED',
      archivedAt: now(),
    },
  })

  const folder = await prisma.archiveFolder.findUnique({ where: { id: document.folderId } })
  if (folder) {
    await createAuditLog({
      action: 'ARCHIVE',
      entityType: 'ARCHIVE_DOCUMENT',
      entityId: documentId,
      userId,
      details: { status: 'ARCHIVED' },
      hierarchyEntityId: hierarchyEntityId || folder.hierarchyEntityId,
      hierarchyEntityType: 'ARCHIVE_DOCUMENT',
    })
  }

  return { success: true, documentId }
}

export async function deleteArchiveDocument(documentId: string, userId: string) {
  const { prisma } = await import('@/lib/prisma')
  const document = await prisma.archiveDocument.findUnique({ where: { id: documentId } })
  if (!document) {
    throw new Error('الوثيقة غير موجودة')
  }

  await prisma.archiveDocument.delete({ where: { id: documentId } })

  const folder = await prisma.archiveFolder.findUnique({ where: { id: document.folderId } })
  if (folder) {
    await createAuditLog({
      action: 'DELETE',
      entityType: 'ARCHIVE_DOCUMENT',
      entityId: documentId,
      userId,
      details: { title: document.title },
      hierarchyEntityId: folder.hierarchyEntityId,
      hierarchyEntityType: 'ARCHIVE_DOCUMENT',
    })
  }

  return { success: true, message: 'تم حذف الوثيقة بنجاح' }
}

export async function getArchiveStatistics(hierarchyEntityId: string) {
  const { prisma } = await import('@/lib/prisma')
  const folders = await prisma.archiveFolder.findMany({
    where: { hierarchyEntityId },
  })
  const folderIds = folders.map((folder) => folder.id)
  const documents = await prisma.archiveDocument.findMany({
    where: { folderId: { in: folderIds } },
    include: { folder: true },
  })

  const recentDocuments = documents
    .slice()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10)
    .map((document) => ({
      id: document.id,
      title: document.title,
      documentNumber: document.documentNumber,
      createdAt: document.createdAt,
      folder: {
        name: document.folder.name,
      },
    }))

  return {
    hierarchyEntityId,
    folderCount: folders.length,
    documentCount: documents.length,
    totalSizeBytes: documents.reduce((sum, document) => sum + document.fileSize, 0),
    recentDocuments,
  }
}
