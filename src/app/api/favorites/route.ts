import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { favorites, profiles, notifications } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

async function getUserProfile(userId: string) {
  const profile = await db.select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  
  return profile.length > 0 ? profile[0] : null;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      }, { status: 401 });
    }

    const userProfile = await getUserProfile(session.user.id);
    
    if (!userProfile) {
      return NextResponse.json({ 
        error: 'User profile not found',
        code: 'PROFILE_NOT_FOUND'
      }, { status: 404 });
    }

    const body = await request.json();
    const { favoritedProfileId } = body;

    if (!favoritedProfileId || typeof favoritedProfileId !== 'number') {
      return NextResponse.json({ 
        error: 'Valid favoritedProfileId is required',
        code: 'INVALID_FAVORITED_PROFILE_ID'
      }, { status: 400 });
    }

    if (userProfile.id === favoritedProfileId) {
      return NextResponse.json({ 
        error: 'Cannot favorite your own profile',
        code: 'SELF_FAVORITE_NOT_ALLOWED'
      }, { status: 400 });
    }

    const favoritedProfile = await db.select()
      .from(profiles)
      .where(eq(profiles.id, favoritedProfileId))
      .limit(1);

    if (favoritedProfile.length === 0) {
      return NextResponse.json({ 
        error: 'Favorited profile not found',
        code: 'FAVORITED_PROFILE_NOT_FOUND'
      }, { status: 404 });
    }

    const existingFavorite = await db.select()
      .from(favorites)
      .where(
        and(
          eq(favorites.profileId, userProfile.id),
          eq(favorites.favoritedProfileId, favoritedProfileId)
        )
      )
      .limit(1);

    if (existingFavorite.length > 0) {
      return NextResponse.json({ 
        error: 'Favorite already exists',
        code: 'FAVORITE_ALREADY_EXISTS'
      }, { status: 400 });
    }

    const newFavorite = await db.insert(favorites)
      .values({
        profileId: userProfile.id,
        favoritedProfileId,
        createdAt: new Date().toISOString()
      })
      .returning();

    await db.insert(notifications)
      .values({
        profileId: favoritedProfileId,
        type: 'favorite',
        content: 'Someone favorited your profile',
        referenceId: newFavorite[0].id,
        isRead: false,
        createdAt: new Date().toISOString()
      });

    return NextResponse.json(newFavorite[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      }, { status: 401 });
    }

    const userProfile = await getUserProfile(session.user.id);
    
    if (!userProfile) {
      return NextResponse.json({ 
        error: 'User profile not found',
        code: 'PROFILE_NOT_FOUND'
      }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    const userFavorites = await db.select({
      id: favorites.id,
      profileId: favorites.profileId,
      favoritedProfileId: favorites.favoritedProfileId,
      createdAt: favorites.createdAt,
      favoritedProfile: {
        id: profiles.id,
        userId: profiles.userId,
        role: profiles.role,
        profilePicture: profiles.profilePicture,
        bio: profiles.bio,
        createdAt: profiles.createdAt,
        updatedAt: profiles.updatedAt
      }
    })
      .from(favorites)
      .leftJoin(profiles, eq(favorites.favoritedProfileId, profiles.id))
      .where(eq(favorites.profileId, userProfile.id))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(userFavorites, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      }, { status: 401 });
    }

    const userProfile = await getUserProfile(session.user.id);
    
    if (!userProfile) {
      return NextResponse.json({ 
        error: 'User profile not found',
        code: 'PROFILE_NOT_FOUND'
      }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: 'Valid ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    const existingFavorite = await db.select()
      .from(favorites)
      .where(
        and(
          eq(favorites.id, parseInt(id)),
          eq(favorites.profileId, userProfile.id)
        )
      )
      .limit(1);

    if (existingFavorite.length === 0) {
      return NextResponse.json({ 
        error: 'Favorite not found',
        code: 'FAVORITE_NOT_FOUND'
      }, { status: 404 });
    }

    const deleted = await db.delete(favorites)
      .where(
        and(
          eq(favorites.id, parseInt(id)),
          eq(favorites.profileId, userProfile.id)
        )
      )
      .returning();

    return NextResponse.json({
      message: 'Favorite deleted successfully',
      favorite: deleted[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}