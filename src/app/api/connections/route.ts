import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { connections, profiles, notifications, user } from '@/db/schema';
import { eq, or, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
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

    const requesterId = userProfile[0].id;

    // Parse request body
    const body = await request.json();
    const { recipientId } = body;

    // Validation: Required fields
    if (!recipientId) {
      return NextResponse.json({ 
        error: 'recipientId is required',
        code: 'MISSING_REQUIRED_FIELD' 
      }, { status: 400 });
    }

    // Validation: recipientId must be a valid integer
    const recipientIdInt = parseInt(recipientId);
    if (isNaN(recipientIdInt)) {
      return NextResponse.json({ 
        error: 'recipientId must be a valid integer',
        code: 'INVALID_RECIPIENT_ID' 
      }, { status: 400 });
    }

    // Validation: Can't connect to yourself
    if (requesterId === recipientIdInt) {
      return NextResponse.json({ 
        error: 'Cannot send connection request to yourself',
        code: 'SELF_CONNECTION_NOT_ALLOWED' 
      }, { status: 400 });
    }

    // Validate recipient profile exists
    const recipientProfile = await db.select()
      .from(profiles)
      .where(eq(profiles.id, recipientIdInt))
      .limit(1);

    if (recipientProfile.length === 0) {
      return NextResponse.json({ 
        error: 'Recipient profile not found',
        code: 'RECIPIENT_NOT_FOUND' 
      }, { status: 404 });
    }

    // Optimized: Check for existing connection using composite index
    const existingConnection = await db.select()
      .from(connections)
      .where(
        or(
          and(
            eq(connections.requesterId, requesterId),
            eq(connections.recipientId, recipientIdInt)
          ),
          and(
            eq(connections.requesterId, recipientIdInt),
            eq(connections.recipientId, requesterId)
          )
        )
      )
      .limit(1);

    if (existingConnection.length > 0) {
      return NextResponse.json({ 
        error: 'Connection already exists between these profiles',
        code: 'CONNECTION_ALREADY_EXISTS' 
      }, { status: 400 });
    }

    // Create connection request
    const timestamp = new Date().toISOString();
    const newConnection = await db.insert(connections)
      .values({
        requesterId,
        recipientId: recipientIdInt,
        status: 'pending',
        createdAt: timestamp,
        updatedAt: timestamp
      })
      .returning();

    // Create notification for recipient
    await db.insert(notifications)
      .values({
        profileId: recipientIdInt,
        type: 'connection_request',
        content: 'You have a new connection request',
        referenceId: newConnection[0].id,
        isRead: false,
        createdAt: timestamp
      });

    return NextResponse.json(newConnection[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
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
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const statusFilter = searchParams.get('status');

    // Build base query with indexed fields
    let whereConditions = or(
      eq(connections.requesterId, profileId),
      eq(connections.recipientId, profileId)
    );

    // Add status filter if provided (uses indexed status field)
    if (statusFilter && ['pending', 'accepted', 'rejected'].includes(statusFilter)) {
      whereConditions = and(
        whereConditions,
        eq(connections.status, statusFilter)
      );
    }

    // Optimized: Single query with joins to get all connection data at once
    const userConnections = await db.select({
      id: connections.id,
      requesterId: connections.requesterId,
      recipientId: connections.recipientId,
      status: connections.status,
      createdAt: connections.createdAt,
      updatedAt: connections.updatedAt,
      requesterProfile: {
        id: profiles.id,
        userId: profiles.userId,
        role: profiles.role,
        profilePicture: profiles.profilePicture,
        bio: profiles.bio,
        createdAt: profiles.createdAt,
        updatedAt: profiles.updatedAt,
      },
      requesterUser: {
        name: user.name,
        email: user.email,
      }
    })
      .from(connections)
      .leftJoin(profiles, eq(connections.requesterId, profiles.id))
      .leftJoin(user, eq(profiles.userId, user.id))
      .where(whereConditions)
      .limit(limit)
      .offset(offset);

    // Get recipient profiles in a separate optimized query
    const recipientIds = userConnections.map(conn => conn.recipientId);
    const recipientProfiles = await db.select({
      id: profiles.id,
      userId: profiles.userId,
      role: profiles.role,
      profilePicture: profiles.profilePicture,
      bio: profiles.bio,
      createdAt: profiles.createdAt,
      updatedAt: profiles.updatedAt,
      userName: user.name,
      userEmail: user.email,
    })
      .from(profiles)
      .leftJoin(user, eq(profiles.userId, user.id))
      .where(or(...recipientIds.map(id => eq(profiles.id, id))));

    // Create map for fast lookup
    const recipientMap = new Map(
      recipientProfiles.map(profile => [profile.id, profile])
    );

    // Combine data
    const enrichedConnections = userConnections.map(conn => ({
      id: conn.id,
      requesterId: conn.requesterId,
      recipientId: conn.recipientId,
      status: conn.status,
      createdAt: conn.createdAt,
      updatedAt: conn.updatedAt,
      requesterProfile: {
        ...conn.requesterProfile,
        userName: conn.requesterUser.name,
        userEmail: conn.requesterUser.email,
      },
      recipientProfile: recipientMap.get(conn.recipientId),
    }));

    // Add caching headers
    const response = NextResponse.json(enrichedConnections, { status: 200 });
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=30');
    
    return response;

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}