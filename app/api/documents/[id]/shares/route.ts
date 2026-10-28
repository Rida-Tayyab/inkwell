import { getCurrentUserId } from '@/lib/auth';
import { db } from '@/lib/db';
import { documentShares, users as usersTable } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { apiError, apiSuccess, isUuid } from '@/lib/api';
import { getRole, can } from '@/lib/access';
import { shareDocumentSchema, revokeShareSchema } from '@/lib/validation';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return apiError(401, 'UNAUTHORIZED', 'Not authenticated');
  }

  const { id } = await params;
  if (!isUuid(id)) {
    return apiError(404, 'NOT_FOUND', 'Document not found');
  }

  // Collaborator list reveals other members' emails, so only the owner
  // (who can also manage sharing) gets to see it — not every reader.
  const role = await getRole(userId, id);
  if (!can(role, 'share')) {
    return apiError(404, 'NOT_FOUND', 'Document not found');
  }

  const shares = await db.query.documentShares.findMany({
    where: eq(documentShares.documentId, id),
    with: { user: { columns: { id: true, email: true, name: true } } },
  });

  return apiSuccess(shares);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
    const { email, role: newRole } = shareDocumentSchema.parse(body);

    const docRole = await getRole(userId, id);
    if (!can(docRole, 'share')) {
      return apiError(404, 'NOT_FOUND', 'Document not found');
    }

    // Check if user exists
    const targetUser = await db.query.users.findFirst({
      where: eq(usersTable.email, email),
    });

    if (!targetUser) {
      return apiError(400, 'USER_NOT_FOUND', 'User with that email not found');
    }

    // Prevent sharing with self
    if (targetUser.id === userId) {
      return apiError(400, 'CANNOT_SHARE_WITH_SELF', 'You cannot share a document with yourself');
    }

    // Upsert share (update if exists, create if not)
    const existing = await db.query.documentShares.findFirst({
      where: and(eq(documentShares.documentId, id), eq(documentShares.userId, targetUser.id)),
    });

    if (existing) {
      await db
        .update(documentShares)
        .set({ role: newRole })
        .where(
          and(eq(documentShares.documentId, id), eq(documentShares.userId, targetUser.id))
        );
    } else {
      await db.insert(documentShares).values({
        documentId: id,
        userId: targetUser.id,
        role: newRole,
      });
    }

    return apiSuccess({ success: true }, 201);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(400, 'VALIDATION_ERROR', error.errors[0].message);
    }
    console.error('Share document error:', error);
    return apiError(500, 'INTERNAL_ERROR', 'Failed to share document');
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

  const url = new URL(request.url);
  const userToRevoke = url.searchParams.get('userId');

  if (!userToRevoke) {
    return apiError(400, 'MISSING_PARAM', 'userId query parameter required');
  }

  try {
    revokeShareSchema.parse({ userId: userToRevoke });

    const role = await getRole(userId, id);
    if (!can(role, 'share')) {
      return apiError(404, 'NOT_FOUND', 'Document not found');
    }

    await db
      .delete(documentShares)
      .where(and(eq(documentShares.documentId, id), eq(documentShares.userId, userToRevoke)));

    return apiSuccess({ success: true });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(400, 'VALIDATION_ERROR', error.errors[0].message);
    }
    console.error('Revoke share error:', error);
    return apiError(500, 'INTERNAL_ERROR', 'Failed to revoke share');
  }
}
