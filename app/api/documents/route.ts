import { getCurrentUserId } from '@/lib/auth';
import { db } from '@/lib/db';
import { documents, documentShares } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { apiError, apiSuccess } from '@/lib/api';
import { createDocumentSchema } from '@/lib/validation';

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return apiError(401, 'UNAUTHORIZED', 'Not authenticated');
  }

  // Fetch owned documents
  const owned = await db.query.documents.findMany({
    where: eq(documents.ownerId, userId),
    orderBy: (doc) => doc.updatedAt,
  });

  // Fetch shared documents
  const sharedDocs = await db.query.documentShares.findMany({
    where: eq(documentShares.userId, userId),
    with: {
      document: true,
    },
  });

  const shared = sharedDocs.map((share) => ({
    ...share.document,
    role: share.role,
  }));

  return apiSuccess({ owned, shared });
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return apiError(401, 'UNAUTHORIZED', 'Not authenticated');
  }

  try {
    const body = await request.json();
    const { title } = createDocumentSchema.parse(body);

    const doc = await db
      .insert(documents)
      .values({
        ownerId: userId,
        title: title || 'Untitled document',
        content: { type: 'doc', content: [] },
      })
      .returning()
      .then((rows) => rows[0]);

    return apiSuccess({ ...doc, role: 'owner' }, 201);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return apiError(400, 'VALIDATION_ERROR', error.errors[0].message);
    }
    console.error('Create document error:', error);
    return apiError(500, 'INTERNAL_ERROR', 'Failed to create document');
  }
}
