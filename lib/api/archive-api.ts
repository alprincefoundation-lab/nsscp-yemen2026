import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getArchiveDocuments, createArchiveDocument, type ArchiveSearchParams } from '@/lib/services/archive-service';
import type { RBACUser } from '@/lib/core/rbac-engine';

function toPositiveInteger(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function resolveUser(request: NextRequest): Promise<RBACUser | null> {
  const user = await getAuthenticatedUser(request);
  if (!user) return null;

  return {
    id: user.id,
    username: user.username,
    role: user.role,
    fullName: user.fullName,
    hierarchyEntityIds: user.hierarchyEntityId ? [user.hierarchyEntityId] : undefined,
  };
}

export async function handleArchiveGet(request: NextRequest, category?: string) {
  const user = await resolveUser(request);
  if (!user) {
    return NextResponse.json({ error: 'غير مصرح بالوصول' }, { status: 401 });
  }

  const url = new URL(request.url);
  const page = toPositiveInteger(url.searchParams.get('page'), 1);
  const pageSize = toPositiveInteger(url.searchParams.get('pageSize'), 20);
  const query = url.searchParams.get('search') || url.searchParams.get('query') || category || undefined;
  const hierarchyEntityId = url.searchParams.get('hierarchyEntityId') || user.hierarchyEntityIds?.[0];

  const result = await getArchiveDocuments({
    page,
    pageSize,
    query,
    hierarchyEntityId: hierarchyEntityId || undefined,
  } satisfies ArchiveSearchParams, user);

  return NextResponse.json({
    module: category || 'archive',
    ...result,
    records: result.data,
  });
}

export async function handleArchivePost(request: NextRequest, category?: string) {
  const user = await resolveUser(request);
  if (!user) {
    return NextResponse.json({ error: 'غير مصرح بالوصول' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({} as Record<string, unknown>));
  const rawTags = body.tags;
  if (
    typeof body.title !== 'string' ||
    typeof body.documentNumber !== 'string' ||
    typeof body.folderId !== 'string' ||
    typeof body.filePath !== 'string' ||
    typeof body.mimeType !== 'string' ||
    typeof body.fileSize !== 'number'
  ) {
    return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
  }

  const document = await createArchiveDocument(
    {
      title: body.title,
      description: typeof body.description === 'string' ? body.description : undefined,
      documentNumber: body.documentNumber,
      folderId: body.folderId,
      filePath: body.filePath,
      mimeType: body.mimeType,
      fileSize: body.fileSize,
      tags: Array.isArray(rawTags)
        ? (rawTags as unknown[]).filter((tag: unknown): tag is string => typeof tag === 'string')
        : category
          ? [category]
          : undefined,
      metadata: body.metadata && typeof body.metadata === 'object' ? (body.metadata as Record<string, unknown>) : undefined,
    },
    user.id,
    user.id,
  );

  return NextResponse.json({
    success: true,
    module: category || 'archive',
    data: document,
  }, { status: 201 });
}
