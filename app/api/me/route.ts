import { getCurrentUserId } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { apiError, apiSuccess } from '@/lib/api';

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return apiError(401, 'UNAUTHORIZED', 'Not authenticated');
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    return apiError(404, 'NOT_FOUND', 'User not found');
  }

  return apiSuccess({ id: user.id, email: user.email, name: user.name });
}
