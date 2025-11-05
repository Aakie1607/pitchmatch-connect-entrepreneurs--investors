import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { favorites, profiles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get session
    const session = await auth.api.getSession({ 
      headers: request.headers 
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Get authenticated user's profile
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

    const userProfileId = userProfile[0].id;

    // Get and validate favorite ID from params
    const { id } = await params;
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid favorite ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const favoriteId = parseInt(id);

    // Check if favorite exists
    const existingFavorite = await db
      .select()
      .from(favorites)
      .where(eq(favorites.id, favoriteId))
      .limit(1);

    if (existingFavorite.length === 0) {
      return NextResponse.json(
        { error: 'Favorite not found', code: 'FAVORITE_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Verify ownership - user must own this favorite
    if (existingFavorite[0].profileId !== userProfileId) {
      return NextResponse.json(
        { 
          error: 'You do not have permission to delete this favorite', 
          code: 'FORBIDDEN' 
        },
        { status: 403 }
      );
    }

    // Delete the favorite
    const deleted = await db
      .delete(favorites)
      .where(
        and(
          eq(favorites.id, favoriteId),
          eq(favorites.profileId, userProfileId)
        )
      )
      .returning();

    return NextResponse.json(
      {
        message: 'Favorite removed successfully',
        favorite: deleted[0]
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('DELETE favorite error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}