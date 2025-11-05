import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { videos, videoViews, profiles } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Validate ID is a valid integer
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid video ID is required',
          code: 'INVALID_ID' 
        },
        { status: 400 }
      );
    }

    const videoId = parseInt(id);

    // Check if video exists
    const video = await db.select()
      .from(videos)
      .where(eq(videos.id, videoId))
      .limit(1);

    if (video.length === 0) {
      return NextResponse.json(
        { 
          error: 'Video not found',
          code: 'VIDEO_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    // Optional: Get authenticated user's profile id if logged in
    let viewerId: number | null = null;
    
    try {
      const user = await getCurrentUser(request);
      if (user) {
        // Get the user's profile id
        const userProfile = await db.select()
          .from(profiles)
          .where(eq(profiles.userId, user.id))
          .limit(1);

        if (userProfile.length > 0) {
          viewerId = userProfile[0].id;
        }
      }
    } catch (error) {
      // User is not authenticated, continue with null viewerId (anonymous view)
      console.log('Anonymous video view');
    }

    // Use transaction to ensure atomic operations
    const result = await db.transaction(async (tx) => {
      // Create video view record
      await tx.insert(videoViews).values({
        videoId: videoId,
        viewerId: viewerId,
        createdAt: new Date().toISOString()
      });

      // Increment views count in videos table
      const updatedVideo = await tx.update(videos)
        .set({
          viewsCount: sql`${videos.viewsCount} + 1`,
          updatedAt: new Date().toISOString()
        })
        .where(eq(videos.id, videoId))
        .returning();

      return updatedVideo[0];
    });

    return NextResponse.json({
      success: true,
      videoId: result.id,
      viewsCount: result.viewsCount,
      viewedAt: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    console.error('POST video view error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}