import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { messages, connections, profiles } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Validate message ID
    const messageId = params.id;
    if (!messageId || isNaN(parseInt(messageId))) {
      return NextResponse.json(
        { error: 'Valid message ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Get the message
    const message = await db
      .select()
      .from(messages)
      .where(eq(messages.id, parseInt(messageId)))
      .limit(1);

    if (message.length === 0) {
      return NextResponse.json(
        { error: 'Message not found', code: 'MESSAGE_NOT_FOUND' },
        { status: 404 }
      );
    }

    const messageData = message[0];

    // Check if user is the sender (can't mark own message as read)
    if (messageData.senderId === profileId) {
      return NextResponse.json(
        {
          error: 'Cannot mark your own message as read',
          code: 'SENDER_CANNOT_MARK_READ',
        },
        { status: 403 }
      );
    }

    // Get connection details to verify user is the recipient
    const connection = await db
      .select()
      .from(connections)
      .where(eq(connections.id, messageData.connectionId))
      .limit(1);

    if (connection.length === 0) {
      return NextResponse.json(
        { error: 'Connection not found', code: 'CONNECTION_NOT_FOUND' },
        { status: 404 }
      );
    }

    const connectionData = connection[0];

    // Verify user is part of the connection
    const isRequester = connectionData.requesterId === profileId;
    const isRecipient = connectionData.recipientId === profileId;

    if (!isRequester && !isRecipient) {
      return NextResponse.json(
        {
          error: 'You are not part of this connection',
          code: 'NOT_AUTHORIZED',
        },
        { status: 403 }
      );
    }

    // Determine the recipient of the message
    // If user is requester, then recipient in connection is the other party
    // If user is recipient, then requester in connection is the other party
    // The sender of the message is stored in senderId, and we need to verify
    // that the current user is NOT the sender (already checked above)
    // and IS the intended recipient of this message in the connection

    // Additional verification: ensure the sender is the other party in the connection
    const otherPartyId = isRequester
      ? connectionData.recipientId
      : connectionData.requesterId;

    if (messageData.senderId !== otherPartyId) {
      return NextResponse.json(
        {
          error: 'Invalid message-connection relationship',
          code: 'INVALID_MESSAGE',
        },
        { status: 403 }
      );
    }

    // Update message to mark as read
    const updated = await db
      .update(messages)
      .set({
        isRead: true,
      })
      .where(eq(messages.id, parseInt(messageId)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update message', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(updated[0], { status: 200 });
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