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

    // Optimized: Get user's profile using indexed userId
    const userProfile = await db.select({ id: profiles.id })
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

    // Optimized: Build query using composite index (profileId, isRead) for fast filtering
    let whereConditions;
    
    if (isReadParam !== null) {
      const isReadValue = isReadParam === 'true';
      // Uses composite index: notifications_profile_read_idx
      whereConditions = and(
        eq(notifications.profileId, profileId),
        eq(notifications.isRead, isReadValue)
      );
    } else {
      // Uses single index: notifications_profile_id_idx
      whereConditions = eq(notifications.profileId, profileId);
    }

    // Execute query with indexed fields for sorting (createdAt is indexed)
    const results = await db.select()
      .from(notifications)
      .where(whereConditions)
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    // Add caching headers (short cache for real-time notifications)
    const response = NextResponse.json(results, { status: 200 });
    response.headers.set('Cache-Control', 'private, max-age=15, stale-while-revalidate=30');
    
    return response;

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}