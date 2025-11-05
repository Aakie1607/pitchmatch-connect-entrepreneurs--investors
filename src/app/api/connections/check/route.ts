import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { connections, profiles } from '@/db/schema';
import { eq, or, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Authentication check using better-auth
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Get authenticated user's profile
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

    const currentProfileId = userProfile[0].id;

    // Get profileId from query params
    const { searchParams } = new URL(request.url);
    const profileIdParam = searchParams.get('profileId');

    // Validate profileId parameter
    if (!profileIdParam) {
      return NextResponse.json(
        { error: 'profileId query parameter is required', code: 'MISSING_PROFILE_ID' },
        { status: 400 }
      );
    }

    const profileId = parseInt(profileIdParam);
    if (isNaN(profileId)) {
      return NextResponse.json(
        { error: 'profileId must be a valid integer', code: 'INVALID_PROFILE_ID' },
        { status: 400 }
      );
    }

    // Check if the profile exists
    const targetProfile = await db.select()
      .from(profiles)
      .where(eq(profiles.id, profileId))
      .limit(1);

    if (targetProfile.length === 0) {
      return NextResponse.json(
        { error: 'Target profile not found', code: 'TARGET_PROFILE_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Check if connection exists in either direction
    const existingConnection = await db.select()
      .from(connections)
      .where(
        or(
          and(
            eq(connections.requesterId, currentProfileId),
            eq(connections.recipientId, profileId)
          ),
          and(
            eq(connections.requesterId, profileId),
            eq(connections.recipientId, currentProfileId)
          )
        )
      )
      .limit(1);

    // If no connection exists
    if (existingConnection.length === 0) {
      return NextResponse.json({
        exists: false,
        connection: null,
        direction: null,
        status: null
      }, { status: 200 });
    }

    // Connection exists, determine direction
    const connection = existingConnection[0];
    const direction = connection.requesterId === currentProfileId ? 'sent' : 'received';

    return NextResponse.json({
      exists: true,
      connection: connection,
      direction: direction,
      status: connection.status
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}