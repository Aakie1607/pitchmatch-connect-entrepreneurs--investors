import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications, profiles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Get user's profile
    const userProfile = await db.select()
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

    // Update all unread notifications for the user
    const updated = await db.update(notifications)
      .set({
        isRead: true
      })
      .where(
        and(
          eq(notifications.profileId, profileId),
          eq(notifications.isRead, false)
        )
      )
      .returning();

    return NextResponse.json({
      success: true,
      message: 'All notifications marked as read',
      count: updated.length
    }, { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}