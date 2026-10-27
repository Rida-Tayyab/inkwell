import { getCurrentUserId } from '@/lib/auth';
import { db } from '@/lib/db';
import { documents } from '@/lib/schema';
import { apiError, apiSuccess } from '@/lib/api';
import { convertFileToContent } from '@/lib/import';

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return apiError(401, 'UNAUTHORIZED', 'Not authenticated');
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return apiError(400, 'NO_FILE', 'No file provided');
    }

    const result = await convertFileToContent(file);
    if (!result.valid) {
      return apiError(400, 'INVALID_FILE', result.error || 'Failed to process file');
    }

    const doc = await db
      .insert(documents)
      .values({
        ownerId: userId,
        title: result.title || 'Imported document',
        content: result.content,
      })
      .returning()
      .then((rows) => rows[0]);

    return apiSuccess({ ...doc, role: 'owner' }, 201);
  } catch (error) {
    console.error('Import error:', error);
    return apiError(500, 'INTERNAL_ERROR', 'Failed to import file');
  }
}
