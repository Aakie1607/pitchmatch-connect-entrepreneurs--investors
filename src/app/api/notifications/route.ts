import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { notifications, profiles } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED' 
      }, { status: 401 });
    }

    // Get user's profile
    const userProfile = await db.select()
      .from(profiles)
      .where(eq(profiles.userId, session.user.id))
      .limit(1);

    if (userProfile.length === 0) {
      return NextResponse.json({ 
        error: 'User profile not found',
        code: 'PROFILE_NOT_FOUND' 
      }, { status: 404 });
    }

    const profileId = userProfile[0].id;

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const isReadParam = searchParams.get('isRead');

    // Build query
    let query = db.select()
      .from(notifications)
      .where(eq(notifications.profileId, profileId));

    // Apply isRead filter if provided
    if (isReadParam !== null) {
      const isReadValue = isReadParam === 'true';
      query = db.select()
        .from(notifications)
        .where(
          and(
            eq(notifications.profileId, profileId),
            eq(notifications.isRead, isReadValue)
          )
        );
    }

    // Execute query with sorting and pagination
    const results = await query
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}