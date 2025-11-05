import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { messages, connections, profiles, notifications } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED' 
      }, { status: 401 });
    }

    // Get authenticated user's profile
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

    const senderId = userProfile[0].id;

    // Parse request body
    const body = await request.json();
    const { connectionId, content } = body;

    // Validate required fields
    if (!connectionId) {
      return NextResponse.json({ 
        error: 'connectionId is required',
        code: 'MISSING_CONNECTION_ID' 
      }, { status: 400 });
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ 
        error: 'content is required and cannot be empty',
        code: 'MISSING_OR_EMPTY_CONTENT' 
      }, { status: 400 });
    }

    // Validate connectionId is a valid integer
    const parsedConnectionId = parseInt(connectionId.toString());
    if (isNaN(parsedConnectionId)) {
      return NextResponse.json({ 
        error: 'connectionId must be a valid integer',
        code: 'INVALID_CONNECTION_ID' 
      }, { status: 400 });
    }

    // Check if connection exists
    const connection = await db.select()
      .from(connections)
      .where(eq(connections.id, parsedConnectionId))
      .limit(1);

    if (connection.length === 0) {
      return NextResponse.json({ 
        error: 'Connection not found',
        code: 'CONNECTION_NOT_FOUND' 
      }, { status: 404 });
    }

    const connectionRecord = connection[0];

    // Verify connection status is "accepted"
    if (connectionRecord.status !== 'accepted') {
      return NextResponse.json({ 
        error: 'Can only send messages to accepted connections',
        code: 'CONNECTION_NOT_ACCEPTED' 
      }, { status: 403 });
    }

    // Verify authenticated user is part of this connection
    const isRequester = connectionRecord.requesterId === senderId;
    const isRecipient = connectionRecord.recipientId === senderId;

    if (!isRequester && !isRecipient) {
      return NextResponse.json({ 
        error: 'You are not part of this connection',
        code: 'NOT_CONNECTION_PARTICIPANT' 
      }, { status: 403 });
    }

    // Determine recipient ID for notification
    const recipientId = isRequester ? connectionRecord.recipientId : connectionRecord.requesterId;

    // Create message
    const newMessage = await db.insert(messages)
      .values({
        connectionId: parsedConnectionId,
        senderId: senderId,
        content: content.trim(),
        isRead: false,
        createdAt: new Date().toISOString()
      })
      .returning();

    // Create notification for recipient
    await db.insert(notifications)
      .values({
        profileId: recipientId,
        type: 'message',
        content: 'You have a new message',
        referenceId: newMessage[0].id,
        isRead: false,
        createdAt: new Date().toISOString()
      });

    return NextResponse.json(newMessage[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}