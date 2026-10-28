import { getCurrentUserId } from '@/lib/auth';
import { db } from '@/lib/db';
import { documents } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { apiError, apiSuccess } from '@/lib/api';
import { getRole, can } from '@/lib/access';
import { updateDocumentSchema } from '@/lib/validation';
import { isUuid } from '@/lib/api';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return apiError(401, 'UNAUTHORIZED', 'Not authenticated');
  }

  const { id } = await params;
  if (!isUuid(id)) {
    return apiError(404, 'NOT_FOUND', 'Document not found');
  }

  const role = await getRole(userId, id);
  if (!can(role, 'read')) {
    return apiError(404, 'NOT_FOUND', 'Document not found');
  }

  const doc = await db.query.documents.findFirst({
    where: eq(documents.id, id),
  });

  if (!doc) {
    return apiError(404, 'NOT_FOUND', 'Document not found');
  }

  return apiSuccess({ ...doc, role });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return apiError(401, 'UNAUTHORIZED', 'Not authenticated');
  }

  const { id } = await params;
  if (!isUuid(id)) {
    return apiError(404, 'NOT_FOUND', 'Document not found');
  }

  try {
    const body = await request.json();
    const { title, content, baseVersion } = updateDocumentSchema.parse(body);

    const role = await getRole(userId, id);
    if (!can(role, 'edit')) {
      return apiError(404, 'NOT_FOUND', 'Document not found');
    }

    const doc = await db.query.documents.findFirst({
      where: eq(documents.id, id),
    });

    if (!doc) {
      return apiError(404, 'NOT_FOUND', 'Document not found');
    }

    // Check rename permission if title is being changed
    if (title !== undefined && title !== doc.title && !can(role, 'rename')) {
      return apiError(403, 'FORBIDDEN', 'You do not have permission to rename this document');
    }

    // Atomic conditional update: the version check and the write happen in a
    // single statement, so two concurrent saves with the same baseVersion
    // can't both succeed (one write would otherwise silently clobber the other).
    const updated = await db
      .update(documents)
      .set({
        title: title ?? doc.title,
        content: content ?? doc.content,
        version: doc.version + 1,
        updatedAt: new Date(),
      })
      .where(and(eq(documents.id, id), eq(documents.version, baseVersion)))
      .returning()
      .then((rows) => rows[0]);

    if (!updated) {
      return apiError(409, 'CONFLICT', 'Document was modified elsewhere. Please reload.');
    }

    return apiSuccess({ ...updated, role });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(400, 'VALIDATION_ERROR', error.errors[0].message);
    }
    console.error('Update document error:', error);
    return apiError(500, 'INTERNAL_ERROR', 'Failed to update document');
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return apiError(401, 'UNAUTHORIZED', 'Not authenticated');
  }

  const { id } = await params;
  if (!isUuid(id)) {
    return apiError(404, 'NOT_FOUND', 'Document not found');
  }

  const role = await getRole(userId, id);
  if (!can(role, 'delete')) {
    return apiError(404, 'NOT_FOUND', 'Document not found');
  }

  await db.delete(documents).where(eq(documents.id, id));

  return apiSuccess({ success: true });
}
