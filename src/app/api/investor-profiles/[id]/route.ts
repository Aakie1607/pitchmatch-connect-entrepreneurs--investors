import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { investorProfiles, profiles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        },
        { status: 400 }
      );
    }

    // Fetch investor profile
    const investorProfile = await db
      .select()
      .from(investorProfiles)
      .where(eq(investorProfiles.id, parseInt(id)))
      .limit(1);

    if (investorProfile.length === 0) {
      return NextResponse.json(
        { error: 'Investor profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(investorProfile[0], { status: 200 });
  } catch (error) {
    console.error('GET investor profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const id = params.id;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          error: 'Valid ID is required',
          code: 'INVALID_ID' 
        },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { investmentPreferences, industryFocus, fundingCapacity, location } = body;

    // Fetch investor profile with profile information
    const investorProfileResult = await db
      .select({
        investorProfile: investorProfiles,
        profile: profiles,
      })
      .from(investorProfiles)
      .innerJoin(profiles, eq(investorProfiles.profileId, profiles.id))
      .where(eq(investorProfiles.id, parseInt(id)))
      .limit(1);

    if (investorProfileResult.length === 0) {
      return NextResponse.json(
        { error: 'Investor profile not found' },
        { status: 404 }
      );
    }

    const { investorProfile, profile } = investorProfileResult[0];

    // Authorization check - verify user owns this profile
    if (profile.userId !== session.user.id) {
      return NextResponse.json(
        { 
          error: 'You do not have permission to update this investor profile',
          code: 'FORBIDDEN' 
        },
        { status: 403 }
      );
    }

    // Prepare update data - only include provided fields
    const updateData: {
      investmentPreferences?: string;
      industryFocus?: string;
      fundingCapacity?: string;
      location?: string;
      updatedAt: string;
    } = {
      updatedAt: new Date().toISOString(),
    };

    if (investmentPreferences !== undefined) {
      updateData.investmentPreferences = investmentPreferences;
    }
    if (industryFocus !== undefined) {
      updateData.industryFocus = industryFocus;
    }
    if (fundingCapacity !== undefined) {
      updateData.fundingCapacity = fundingCapacity;
    }
    if (location !== undefined) {
      updateData.location = location;
    }

    // Update investor profile
    const updatedProfile = await db
      .update(investorProfiles)
      .set(updateData)
      .where(eq(investorProfiles.id, parseInt(id)))
      .returning();

    if (updatedProfile.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update investor profile' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedProfile[0], { status: 200 });
  } catch (error) {
    console.error('PUT investor profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}