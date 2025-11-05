import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const profileId = parseInt(id);

    // Fetch profile by ID
    const profile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, profileId))
      .limit(1);

    if (profile.length === 0) {
      return NextResponse.json(
        { error: 'Profile not found', code: 'PROFILE_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(profile[0], { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'AUTHENTICATION_REQUIRED' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const profileId = parseInt(id);

    // Fetch existing profile
    const existingProfile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, profileId))
      .limit(1);

    if (existingProfile.length === 0) {
      return NextResponse.json(
        { error: 'Profile not found', code: 'PROFILE_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Verify profile ownership
    if (existingProfile[0].userId !== session.user.id) {
      return NextResponse.json(
        {
          error: 'You do not have permission to update this profile',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { role, profilePicture, bio } = body;

    // Security check: reject if userId provided in body
    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json(
        {
          error: 'User ID cannot be provided in request body',
          code: 'USER_ID_NOT_ALLOWED',
        },
        { status: 400 }
      );
    }

    // Validate role if provided
    if (role !== undefined && role !== 'entrepreneur' && role !== 'investor') {
      return NextResponse.json(
        {
          error: 'Role must be either "entrepreneur" or "investor"',
          code: 'INVALID_ROLE',
        },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: {
      role?: string;
      profilePicture?: string | null;
      bio?: string | null;
      updatedAt: string;
    } = {
      updatedAt: new Date().toISOString(),
    };

    if (role !== undefined) {
      updateData.role = role;
    }

    if (profilePicture !== undefined) {
      updateData.profilePicture = profilePicture;
    }

    if (bio !== undefined) {
      updateData.bio = bio;
    }

    // Update profile
    const updatedProfile = await db
      .update(profiles)
      .set(updateData)
      .where(eq(profiles.id, profileId))
      .returning();

    if (updatedProfile.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update profile', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedProfile[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}