import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { investorProfiles, profiles } from '@/db/schema';
import { eq, like, and, or } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const body = await request.json();
    const { profileId, investmentPreferences, industryFocus, fundingCapacity, location } = body;

    // Validate required fields
    if (!profileId) {
      return NextResponse.json({ 
        error: 'profileId is required',
        code: 'MISSING_REQUIRED_FIELD' 
      }, { status: 400 });
    }

    // Validate profileId is a valid integer
    if (isNaN(parseInt(profileId))) {
      return NextResponse.json({ 
        error: 'profileId must be a valid number',
        code: 'INVALID_PROFILE_ID' 
      }, { status: 400 });
    }

    // Verify profile exists and belongs to authenticated user
    const profile = await db.select()
      .from(profiles)
      .where(eq(profiles.id, parseInt(profileId)))
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
        error: 'You do not have permission to create an investor profile for this profile',
        code: 'FORBIDDEN' 
      }, { status: 403 });
    }

    // Verify profile role is "investor"
    if (profile[0].role !== 'investor') {
      return NextResponse.json({ 
        error: 'Profile role must be "investor" to create an investor profile',
        code: 'INVALID_PROFILE_ROLE' 
      }, { status: 403 });
    }

    // Check if investor profile already exists for this profileId
    const existingInvestorProfile = await db.select()
      .from(investorProfiles)
      .where(eq(investorProfiles.profileId, parseInt(profileId)))
      .limit(1);

    if (existingInvestorProfile.length > 0) {
      return NextResponse.json({ 
        error: 'Investor profile already exists for this profile',
        code: 'INVESTOR_PROFILE_EXISTS' 
      }, { status: 400 });
    }

    // Prepare insert data
    const insertData = {
      profileId: parseInt(profileId),
      investmentPreferences: investmentPreferences?.trim() || null,
      industryFocus: industryFocus?.trim() || null,
      fundingCapacity: fundingCapacity?.trim() || null,
      location: location?.trim() || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Create investor profile
    const newInvestorProfile = await db.insert(investorProfiles)
      .values(insertData)
      .returning();

    return NextResponse.json(newInvestorProfile[0], { status: 201 });

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
    const industryFocusFilter = searchParams.get('industryFocus');
    const fundingCapacityFilter = searchParams.get('fundingCapacity');
    const locationFilter = searchParams.get('location');
    const search = searchParams.get('search');

    let query = db.select().from(investorProfiles);

    // Build filter conditions
    const conditions = [];

    if (industryFocusFilter) {
      conditions.push(like(investorProfiles.industryFocus, `%${industryFocusFilter}%`));
    }

    if (fundingCapacityFilter) {
      conditions.push(like(investorProfiles.fundingCapacity, `%${fundingCapacityFilter}%`));
    }

    if (locationFilter) {
      conditions.push(like(investorProfiles.location, `%${locationFilter}%`));
    }

    if (search) {
      conditions.push(like(investorProfiles.investmentPreferences, `%${search}%`));
    }

    // Apply filters if any exist
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Execute query with pagination
    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}