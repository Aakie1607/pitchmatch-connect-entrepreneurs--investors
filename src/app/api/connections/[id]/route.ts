import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { connections, profiles, notifications } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication check
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
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

    // Get connection ID from params
    const { id } = await params;
    const connectionId = parseInt(id);

    if (!connectionId || isNaN(connectionId)) {
      return NextResponse.json(
        { error: 'Valid connection ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Get request body
    const { status } = await request.json();

    // Validate status
    if (!status || (status !== 'accepted' && status !== 'rejected')) {
      return NextResponse.json(
        {
          error: 'Status must be either "accepted" or "rejected"',
          code: 'INVALID_STATUS',
        },
        { status: 400 }
      );
    }

    // Find the connection
    const existingConnection = await db
      .select()
      .from(connections)
      .where(eq(connections.id, connectionId))
      .limit(1);

    if (existingConnection.length === 0) {
      return NextResponse.json(
        { error: 'Connection not found', code: 'CONNECTION_NOT_FOUND' },
        { status: 404 }
      );
    }

    const connection = existingConnection[0];

    // Verify user is the recipient
    if (connection.recipientId !== profileId) {
      return NextResponse.json(
        {
          error: 'You are not authorized to update this connection',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // Verify connection is pending
    if (connection.status !== 'pending') {
      return NextResponse.json(
        {
          error: 'Connection is not pending',
          code: 'CONNECTION_NOT_PENDING',
        },
        { status: 400 }
      );
    }

    // Update connection status
    const updatedConnection = await db
      .update(connections)
      .set({
        status,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(connections.id, connectionId))
      .returning();

    // Create notification for requester if accepted
    if (status === 'accepted') {
      await db.insert(notifications).values({
        profileId: connection.requesterId,
        type: 'connection_request',
        content: 'Your connection request was accepted',
        referenceId: connectionId,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json(updatedConnection[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}