import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { entrepreneurProfiles, profiles } from '@/db/schema';
import { eq, like, and, or } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED' 
      }, { status: 401 });
    }

    const body = await request.json();
    const { 
      profileId, 
      startupName, 
      businessDescription, 
      industry, 
      fundingStage, 
      location, 
      website 
    } = body;

    // Validate required fields
    if (!profileId) {
      return NextResponse.json({ 
        error: 'profileId is required',
        code: 'MISSING_PROFILE_ID' 
      }, { status: 400 });
    }

    if (!startupName || typeof startupName !== 'string' || startupName.trim() === '') {
      return NextResponse.json({ 
        error: 'startupName is required and must be a non-empty string',
        code: 'MISSING_STARTUP_NAME' 
      }, { status: 400 });
    }

    if (isNaN(parseInt(String(profileId)))) {
      return NextResponse.json({ 
        error: 'profileId must be a valid integer',
        code: 'INVALID_PROFILE_ID' 
      }, { status: 400 });
    }

    // Verify profile exists and belongs to authenticated user
    const profile = await db.select()
      .from(profiles)
      .where(eq(profiles.id, parseInt(String(profileId))))
      .limit(1);

    if (profile.length === 0) {
      return NextResponse.json({ 
        error: 'Profile not found',
        code: 'PROFILE_NOT_FOUND' 
      }, { status: 404 });
    }

    // Verify user owns the profile
    if (profile[0].userId !== session.user.id) {
      return NextResponse.json({ 
        error: 'You do not have permission to create an entrepreneur profile for this profile',
        code: 'PROFILE_OWNERSHIP_MISMATCH' 
      }, { status: 403 });
    }

    // Verify profile role is "entrepreneur"
    if (profile[0].role !== 'entrepreneur') {
      return NextResponse.json({ 
        error: 'Profile role must be "entrepreneur" to create an entrepreneur profile',
        code: 'INVALID_PROFILE_ROLE' 
      }, { status: 403 });
    }

    // Check if entrepreneur profile already exists for this profileId
    const existingEntrepreneurProfile = await db.select()
      .from(entrepreneurProfiles)
      .where(eq(entrepreneurProfiles.profileId, parseInt(String(profileId))))
      .limit(1);

    if (existingEntrepreneurProfile.length > 0) {
      return NextResponse.json({ 
        error: 'Entrepreneur profile already exists for this profile',
        code: 'ENTREPRENEUR_PROFILE_EXISTS' 
      }, { status: 400 });
    }

    // Create entrepreneur profile
    const now = new Date().toISOString();
    const newEntrepreneurProfile = await db.insert(entrepreneurProfiles)
      .values({
        profileId: parseInt(String(profileId)),
        startupName: startupName.trim(),
        businessDescription: businessDescription ? String(businessDescription).trim() : null,
        industry: industry ? String(industry).trim() : null,
        fundingStage: fundingStage ? String(fundingStage).trim() : null,
        location: location ? String(location).trim() : null,
        website: website ? String(website).trim() : null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(newEntrepreneurProfile[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Pagination parameters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    
    // Filter parameters
    const industry = searchParams.get('industry');
    const fundingStage = searchParams.get('fundingStage');
    const location = searchParams.get('location');
    const search = searchParams.get('search');

    // Build query
    let query = db.select().from(entrepreneurProfiles);

    // Apply filters
    const conditions = [];

    if (industry) {
      conditions.push(eq(entrepreneurProfiles.industry, industry));
    }

    if (fundingStage) {
      conditions.push(eq(entrepreneurProfiles.fundingStage, fundingStage));
    }

    if (location) {
      conditions.push(eq(entrepreneurProfiles.location, location));
    }

    if (search) {
      const searchCondition = or(
        like(entrepreneurProfiles.startupName, `%${search}%`),
        like(entrepreneurProfiles.businessDescription, `%${search}%`)
      );
      conditions.push(searchCondition);
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply pagination
    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}