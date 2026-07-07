/**
 * Archive Service – Manages archive folders, documents, and archival workflows for NSSCP.
 * Integrates with Hierarchy for scope isolation, Audit Engine for logging, and Workflow Engine for approval chains.
 */
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/core/audit-engine';
import { executeTransition, type WorkflowEntityType, type WorkflowAction } from '@/lib/core/workflow-engine';
import { getDataScopeFilter, hasHierarchyScopeAccess, type RBACUser } from '@/lib/core/rbac-engine';

// ============================================
// Types
// ============================================

export interface ArchiveFolderInput {
    name: string;
    code: string;
    description?: string;
    hierarchyEntityId: string;
    parentFolderId?: string;
}

export interface ArchiveDocumentInput {
    title: string;
    description?: string;
    documentNumber: string;
    folderId: string;
    filePath: string;
    mimeType: string;
    fileSize: number;
    tags?: string[];
    metadata?: Record<string, unknown>;
}

export interface ArchiveSearchParams {
    query?: string;
    folderId?: string;
    hierarchyEntityId?: string;
    tags?: string[];
    fromDate?: Date;
    toDate?: Date;
    page?: number;
    pageSize?: number;
}

// ============================================
// Archive Folder Operations
// ============================================

/**
 * Create an archive folder
 */
export async function createArchiveFolder(
    input: ArchiveFolderInput,
    userId: string
) {
    const folder = await prisma.archiveFolder.create({
        data: {
            name: input.name,
            code: input.code,
            description: input.description,
            hierarchyEntityId: input.hierarchyEntityId,
            parentFolderId: input.parentFolderId || null,
        },
    });

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
    });

    return folder;
}

/**
 * Get archive folders with hierarchy scope filtering
 */
export async function getArchiveFolders(
    user: RBACUser,
    parentFolderId?: string,
    hierarchyEntityId?: string
) {
    const scopeFilter = await getDataScopeFilter(user);

    const where: Record<string, unknown> = {};

    if (parentFolderId) {
        where.parentFolderId = parentFolderId;
    } else {
        where.parentFolderId = null; // root folders only
    }

    if (hierarchyEntityId) {
        where.hierarchyEntityId = hierarchyEntityId;
    } else if ((scopeFilter as any).parentId) {
        where.hierarchyEntityId = { in: (scopeFilter as any).parentId };
    }

    return prisma.archiveFolder.findMany({
        where: where as any,
        include: {
            _count: {
                select: {
                    documents: true,
                    childFolders: true,
                },
            },
            hierarchyEntity: {
                select: { id: true, name: true, type: true },
            },
        },
        orderBy: { name: 'asc' },
    });
}

/**
 * Get archive folder by ID
 */
export async function getArchiveFolderById(folderId: string, user: RBACUser) {
    const folder = await prisma.archiveFolder.findUnique({
        where: { id: folderId },
        include: {
            childFolders: {
                include: {
                    _count: { select: { documents: true, childFolders: true } },
                },
                orderBy: { name: 'asc' },
            },
            documents: {
                orderBy: { createdAt: 'desc' },
                take: 50,
            },
            hierarchyEntity: {
                select: { id: true, name: true, type: true },
            },
        },
    });

    if (!folder) return null;

    // Check hierarchy scope access
    const hasAccess = await hasHierarchyScopeAccess(user, folder.hierarchyEntityId);
    if (!hasAccess && user.role !== 'SUPER_ADMIN') {
        return null;
    }

    return folder;
}

/**
 * Update an archive folder
 */
export async function updateArchiveFolder(
    folderId: string,
    data: { name?: string; description?: string; parentFolderId?: string },
    userId: string
) {
    const folder = await prisma.archiveFolder.update({
        where: { id: folderId },
        data,
    });

    await createAuditLog({
        action: 'UPDATE',
        entityType: 'ARCHIVE_FOLDER',
        entityId: folderId,
        userId,
        details: data,
        hierarchyEntityId: folder.hierarchyEntityId,
        hierarchyEntityType: 'ARCHIVE_FOLDER',
    });

    return folder;
}

/**
 * Delete an archive folder (only if empty)
 */
export async function deleteArchiveFolder(folderId: string, userId: string) {
    const folder = await prisma.archiveFolder.findUnique({
        where: { id: folderId },
        include: {
            _count: { select: { documents: true, childFolders: true } },
        },
    });

    if (!folder) {
        throw new Error('المجلد غير موجود');
    }

    if (folder._count.documents > 0 || folder._count.childFolders > 0) {
        throw new Error('لا يمكن حذف مجلد غير فارغ. قم بنقل أو حذف المحتويات أولاً');
    }

    await prisma.archiveFolder.delete({ where: { id: folderId } });

    await createAuditLog({
        action: 'DELETE',
        entityType: 'ARCHIVE_FOLDER',
        entityId: folderId,
        userId,
        details: { name: folder.name, code: folder.code },
        hierarchyEntityId: folder.hierarchyEntityId,
        hierarchyEntityType: 'ARCHIVE_FOLDER',
    });

    return { success: true, message: 'تم حذف المجلد بنجاح' };
}

// ============================================
// Archive Document Operations
// ============================================

/**
 * Create an archive document
 */
export async function createArchiveDocument(
    input: ArchiveDocumentInput,
    userId: string,
    uploadedById?: string
) {
    const folder = await prisma.archiveFolder.findUnique({
        where: { id: input.folderId },
        select: { hierarchyEntityId: true },
    });

    if (!folder) {
        throw new Error('المجلد غير موجود');
    }

    const document = await prisma.archiveDocument.create({
        data: {
            title: input.title,
            description: input.description,
            documentNumber: input.documentNumber,
            folderId: input.folderId,
            filePath: input.filePath,
            mimeType: input.mimeType,
            fileSize: input.fileSize,
            tags: input.tags || [],
            metadata: (input.metadata || undefined) as any,
            versions: {
                create: {
                    version: 1,
                    filePath: input.filePath,
                    fileSize: input.fileSize,
                    mimeType: input.mimeType,
                    uploadedById: uploadedById || userId,
                    changes: 'النسخة الأصلية',
                },
            },
        },
        include: {
            versions: {
                orderBy: { version: 'desc' },
                take: 1,
            },
        },
    });

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
    });

    return document;
}

/**
 * Get documents with search and pagination
 */
export async function getArchiveDocuments(
    params: ArchiveSearchParams,
    user: RBACUser
) {
    const scopeFilter = await getDataScopeFilter(user);
    const where: Record<string, unknown> = {};

    if (params.query) {
        where.OR = [
            { title: { contains: params.query, mode: 'insensitive' } },
            { documentNumber: { contains: params.query, mode: 'insensitive' } },
            { description: { contains: params.query, mode: 'insensitive' } },
        ];
    }

    if (params.folderId) {
        where.folderId = params.folderId;
    }

    if (params.tags && params.tags.length > 0) {
        where.tags = { hasSome: params.tags };
    }

    if (params.fromDate || params.toDate) {
        where.createdAt = {};
        if (params.fromDate) (where.createdAt as Record<string, unknown>).gte = params.fromDate;
        if (params.toDate) (where.createdAt as Record<string, unknown>).lte = params.toDate;
    }

    // Hierarchy scope filter
    if ((scopeFilter as any).parentId) {
        where.folder = {
            hierarchyEntityId: { in: (scopeFilter as any).parentId },
        };
    }

    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
        prisma.archiveDocument.findMany({
            where: where as any,
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageSize,
            include: {
                folder: {
                    select: {
                        id: true,
                        name: true,
                        hierarchyEntity: {
                            select: { id: true, name: true, type: true },
                        },
                    },
                },
                versions: {
                    orderBy: { version: 'desc' },
                    take: 1,
                    include: {
                        uploadedBy: { select: { id: true, username: true, fullName: true } },
                    },
                },
            },
        }),
        prisma.archiveDocument.count({ where: where as any }),
    ]);

    return {
        data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}

/**
 * Get document by ID
 */
export async function getArchiveDocumentById(documentId: string, user: RBACUser) {
    const document = await prisma.archiveDocument.findUnique({
        where: { id: documentId },
        include: {
            folder: {
                select: {
                    id: true,
                    name: true,
                    hierarchyEntityId: true,
                    hierarchyEntity: {
                        select: { id: true, name: true, type: true },
                    },
                },
            },
            versions: {
                orderBy: { version: 'desc' },
                include: {
                    uploadedBy: { select: { id: true, username: true, fullName: true } },
                },
            },
        },
    });

    if (!document) return null;

    // Check hierarchy scope access
    const hasAccess = await hasHierarchyScopeAccess(user, document.folder.hierarchyEntityId);
    if (!hasAccess && user.role !== 'SUPER_ADMIN') {
        return null;
    }

    return document;
}

/**
 * Add a new version to a document
 */
export async function addDocumentVersion(
    documentId: string,
    data: {
        filePath: string;
        fileSize: number;
        mimeType: string;
        changes?: string;
    },
    userId: string
) {
    const document = await prisma.archiveDocument.findUnique({
        where: { id: documentId },
        select: {
            id: true,
            title: true,
            folder: { select: { hierarchyEntityId: true } },
        },
    });

    if (!document) {
        throw new Error('الوثيقة غير موجودة');
    }

    const lastVersion = await prisma.documentVersion.findFirst({
        where: { documentId },
        orderBy: { version: 'desc' },
        select: { version: true },
    });

    const newVersion = (lastVersion?.version || 0) + 1;

    const version = await prisma.documentVersion.create({
        data: {
            documentId,
            version: newVersion,
            filePath: data.filePath,
            fileSize: data.fileSize,
            mimeType: data.mimeType,
            changes: data.changes || null,
            uploadedById: userId,
        },
    });

    // Update document's file path to point to latest version
    await prisma.archiveDocument.update({
        where: { id: documentId },
        data: {
            filePath: data.filePath,
            fileSize: data.fileSize,
            mimeType: data.mimeType,
        },
    });

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
        hierarchyEntityId: document.folder.hierarchyEntityId,
        hierarchyEntityType: 'ARCHIVE_DOCUMENT',
    });

    return version;
}

/**
 * Archive a document (soft-delete via workflow)
 */
export async function archiveDocument(documentId: string, userId: string, hierarchyEntityId?: string) {
    const result = await executeTransition({
        entityType: 'ARCHIVE',
        entityId: documentId,
        action: 'ARCHIVE',
        fromStatus: 'ACTIVE',
        toStatus: 'ARCHIVED',
        userId,
        hierarchyEntityId,
    });

    return result;
}

/**
 * Delete a document permanently
 */
export async function deleteArchiveDocument(documentId: string, userId: string) {
    const document = await prisma.archiveDocument.findUnique({
        where: { id: documentId },
        select: {
            title: true,
            folder: { select: { hierarchyEntityId: true } },
        },
    });

    if (!document) {
        throw new Error('الوثيقة غير موجودة');
    }

    await prisma.archiveDocument.delete({ where: { id: documentId } });

    await createAuditLog({
        action: 'DELETE',
        entityType: 'ARCHIVE_DOCUMENT',
        entityId: documentId,
        userId,
        details: { title: document.title },
        hierarchyEntityId: document.folder.hierarchyEntityId,
        hierarchyEntityType: 'ARCHIVE_DOCUMENT',
    });

    return { success: true, message: 'تم حذف الوثيقة بنجاح' };
}

// ============================================
// Archive Statistics
// ============================================

/**
 * Get archive statistics for a hierarchy entity
 */
export async function getArchiveStatistics(hierarchyEntityId: string) {
    const folderCount = await prisma.archiveFolder.count({
        where: { hierarchyEntityId },
    });

    const documentCount = await prisma.archiveDocument.count({
        where: {
            folder: { hierarchyEntityId },
        },
    });

    const totalSize = await prisma.archiveDocument.aggregate({
        where: {
            folder: { hierarchyEntityId },
        },
        _sum: { fileSize: true },
    });

    const recentDocuments = await prisma.archiveDocument.findMany({
        where: {
            folder: { hierarchyEntityId },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
            id: true,
            title: true,
            documentNumber: true,
            createdAt: true,
            folder: { select: { name: true } },
        },
    });

    return {
        hierarchyEntityId,
        folderCount,
        documentCount,
        totalSizeBytes: totalSize._sum.fileSize || 0,
        recentDocuments,
    };
}