import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications, profiles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Validate notification ID
    const notificationId = params.id;
    if (!notificationId || isNaN(parseInt(notificationId))) {
      return NextResponse.json(
        { error: 'Valid notification ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Get authenticated user's profile
    const userProfile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, session.user.id))
      .limit(1);

    if (userProfile.length === 0) {
      return NextResponse.json(
        { error: 'User profile not found', code: 'PROFILE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const profileId = userProfile[0].id;

    // Check if notification exists
    const existingNotification = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, parseInt(notificationId)))
      .limit(1);

    if (existingNotification.length === 0) {
      return NextResponse.json(
        { error: 'Notification not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Verify notification belongs to user
    if (existingNotification[0].profileId !== profileId) {
      return NextResponse.json(
        {
          error: 'You do not have permission to update this notification',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // Update notification to mark as read
    const updatedNotification = await db
      .update(notifications)
      .set({
        isRead: true,
      })
      .where(
        and(
          eq(notifications.id, parseInt(notificationId)),
          eq(notifications.profileId, profileId)
        )
      )
      .returning();

    if (updatedNotification.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update notification', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedNotification[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error as Error).message,
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}