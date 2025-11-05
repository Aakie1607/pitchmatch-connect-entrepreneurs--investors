import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { messages, connections, profiles } from '@/db/schema';
import { eq, and, or, asc, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ connectionId: string }> }
) {
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

    // Extract and validate connectionId from params
    const { connectionId: connectionIdParam } = await params;
    const connectionId = parseInt(connectionIdParam);

    if (!connectionIdParam || isNaN(connectionId)) {
      return NextResponse.json(
        { error: 'Valid connection ID is required', code: 'INVALID_CONNECTION_ID' },
        { status: 400 }
      );
    }

    // Verify connection exists
    const connection = await db
      .select()
      .from(connections)
      .where(eq(connections.id, connectionId))
      .limit(1);

    if (connection.length === 0) {
      return NextResponse.json(
        { error: 'Connection not found', code: 'CONNECTION_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Verify user is part of this connection
    const isPartOfConnection =
      connection[0].requesterId === profileId ||
      connection[0].recipientId === profileId;

    if (!isPartOfConnection) {
      return NextResponse.json(
        {
          error: 'You are not authorized to view messages for this connection',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parseInt(searchParams.get('limit') ?? '50'),
      100
    );
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const sortField = searchParams.get('sort') ?? 'createdAt';
    const order = searchParams.get('order') ?? 'asc';

    // Build query with sender profile details
    const orderFn = order === 'desc' ? desc : asc;
    const messagesList = await db
      .select({
        id: messages.id,
        connectionId: messages.connectionId,
        senderId: messages.senderId,
        content: messages.content,
        isRead: messages.isRead,
        createdAt: messages.createdAt,
        sender: {
          id: profiles.id,
          userId: profiles.userId,
          role: profiles.role,
          profilePicture: profiles.profilePicture,
          bio: profiles.bio,
        },
      })
      .from(messages)
      .leftJoin(profiles, eq(messages.senderId, profiles.id))
      .where(eq(messages.connectionId, connectionId))
      .orderBy(orderFn(messages[sortField as keyof typeof messages] ?? messages.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(messagesList, { status: 200 });
  } catch (error) {
    console.error('GET messages error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 }
    );
  }
}