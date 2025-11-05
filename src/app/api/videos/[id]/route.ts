import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { videos, profiles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Validate ID is a valid integer
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        },
        { status: 400 }
      );
    }

    // Fetch single video by ID
    const video = await db.select()
      .from(videos)
      .where(eq(videos.id, parseInt(id)))
      .limit(1);

    if (video.length === 0) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(video[0], { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          code: 'UNAUTHORIZED' 
        },
        { status: 401 }
      );
    }

    const id = params.id;

    // Validate ID is a valid integer
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        },
        { status: 400 }
      );
    }

    // Fetch video to verify ownership
    const video = await db.select()
      .from(videos)
      .where(eq(videos.id, parseInt(id)))
      .limit(1);

    if (video.length === 0) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Get profile to check userId
    const profile = await db.select()
      .from(profiles)
      .where(eq(profiles.id, video[0].profileId))
      .limit(1);

    if (profile.length === 0) {
      return NextResponse.json(
        { error: 'Associated profile not found' },
        { status: 404 }
      );
    }

    // Verify user owns this video
    if (profile[0].userId !== session.user.id) {
      return NextResponse.json(
        { 
          error: 'You do not have permission to delete this video',
          code: 'FORBIDDEN' 
        },
        { status: 403 }
      );
    }

    // Delete the video
    const deleted = await db.delete(videos)
      .where(eq(videos.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      { 
        message: 'Video deleted successfully',
        video: deleted[0]
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}