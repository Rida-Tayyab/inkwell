import { db } from './db';
import { documents, documentShares, users } from './schema';
import { eq, and } from 'drizzle-orm';

export type Role = 'owner' | 'editor' | 'viewer' | null;
export type Action = 'read' | 'edit' | 'rename' | 'share' | 'delete';

/**
 * Single source of truth for document access.
 * Returns the user's role for a specific document.
 * Returns null if the user has no access to the document.
 */
export async function getRole(userId: string, documentId: string): Promise<Role> {
  const doc = await db.query.documents.findFirst({
    where: eq(documents.id, documentId),
  });

  if (!doc) return null;

  // Owner
  if (doc.ownerId === userId) return 'owner';

  // Shared access
  const share = await db.query.documentShares.findFirst({
    where: and(eq(documentShares.documentId, documentId), eq(documentShares.userId, userId)),
  });

  return share?.role || null;
}

/**
 * Permission check: can a given role perform an action?
 */
export function can(role: Role, action: Action): boolean {
  if (!role) return false;

  const permissions: Record<Exclude<Role, null>, Set<Action>> = {
    owner: new Set(['read', 'edit', 'rename', 'share', 'delete']),
    editor: new Set(['read', 'edit', 'rename']),
    viewer: new Set(['read']),
  };

  return permissions[role]?.has(action) ?? false;
}

/**
 * Combined check: Get role and verify permission in one call.
 * Used in API routes.
 */
export async function checkAccess(
  userId: string,
  documentId: string,
  action: Action
): Promise<boolean> {
  const role = await getRole(userId, documentId);
  return can(role, action);
}
