import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { entrepreneurProfiles, profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const entrepreneurProfile = await db
      .select()
      .from(entrepreneurProfiles)
      .where(eq(entrepreneurProfiles.id, parseInt(id)))
      .limit(1);

    if (entrepreneurProfile.length === 0) {
      return NextResponse.json(
        { error: 'Entrepreneur profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(entrepreneurProfile[0], { status: 200 });
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
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const entrepreneurProfileId = parseInt(id);

    const existingProfile = await db
      .select({
        entrepreneurProfile: entrepreneurProfiles,
        profile: profiles,
      })
      .from(entrepreneurProfiles)
      .innerJoin(profiles, eq(entrepreneurProfiles.profileId, profiles.id))
      .where(eq(entrepreneurProfiles.id, entrepreneurProfileId))
      .limit(1);

    if (existingProfile.length === 0) {
      return NextResponse.json(
        { error: 'Entrepreneur profile not found' },
        { status: 404 }
      );
    }

    if (existingProfile[0].profile.userId !== session.user.id) {
      return NextResponse.json(
        {
          error: 'You do not have permission to update this profile',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const {
      startupName,
      businessDescription,
      industry,
      fundingStage,
      location,
      website,
    } = body;

    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (startupName !== undefined) {
      if (typeof startupName !== 'string' || startupName.trim() === '') {
        return NextResponse.json(
          {
            error: 'Startup name must be a non-empty string',
            code: 'INVALID_STARTUP_NAME',
          },
          { status: 400 }
        );
      }
      updates.startupName = startupName.trim();
    }

    if (businessDescription !== undefined) {
      updates.businessDescription =
        businessDescription !== null ? String(businessDescription).trim() : null;
    }

    if (industry !== undefined) {
      updates.industry = industry !== null ? String(industry).trim() : null;
    }

    if (fundingStage !== undefined) {
      updates.fundingStage =
        fundingStage !== null ? String(fundingStage).trim() : null;
    }

    if (location !== undefined) {
      updates.location = location !== null ? String(location).trim() : null;
    }

    if (website !== undefined) {
      updates.website = website !== null ? String(website).trim() : null;
    }

    const updatedProfile = await db
      .update(entrepreneurProfiles)
      .set(updates)
      .where(eq(entrepreneurProfiles.id, entrepreneurProfileId))
      .returning();

    if (updatedProfile.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update entrepreneur profile' },
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