import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { profiles, entrepreneurProfiles, investorProfiles, user } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse pagination parameters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    
    // Parse filter parameters
    const role = searchParams.get('role');
    const industry = searchParams.get('industry');
    const fundingStage = searchParams.get('fundingStage');
    const location = searchParams.get('location');
    const industryFocus = searchParams.get('industryFocus');
    const fundingCapacity = searchParams.get('fundingCapacity');
    const search = searchParams.get('search');

    // Validate role parameter if provided
    if (role && role !== 'entrepreneur' && role !== 'investor') {
      return NextResponse.json({ 
        error: "Invalid role. Must be 'entrepreneur' or 'investor'",
        code: "INVALID_ROLE" 
      }, { status: 400 });
    }

    // Validate role-specific filters
    if (!role) {
      if (industry || fundingStage) {
        return NextResponse.json({ 
          error: "Industry and fundingStage filters require role='entrepreneur'",
          code: "INVALID_FILTER_COMBINATION" 
        }, { status: 400 });
      }
      if (industryFocus || fundingCapacity) {
        return NextResponse.json({ 
          error: "IndustryFocus and fundingCapacity filters require role='investor'",
          code: "INVALID_FILTER_COMBINATION" 
        }, { status: 400 });
      }
    }

    if (role === 'entrepreneur' && (industryFocus || fundingCapacity)) {
      return NextResponse.json({ 
        error: "IndustryFocus and fundingCapacity filters are only valid for investors",
        code: "INVALID_FILTER_FOR_ROLE" 
      }, { status: 400 });
    }

    if (role === 'investor' && (industry || fundingStage)) {
      return NextResponse.json({ 
        error: "Industry and fundingStage filters are only valid for entrepreneurs",
        code: "INVALID_FILTER_FOR_ROLE" 
      }, { status: 400 });
    }

    // Build optimized query based on role
    let results = [];

    if (!role || role === 'entrepreneur') {
      // Optimized: Single query with join to get all data at once
      const entrepreneurConditions = [eq(profiles.role, 'entrepreneur')];
      
      if (industry) {
        entrepreneurConditions.push(eq(entrepreneurProfiles.industry, industry));
      }
      if (fundingStage) {
        entrepreneurConditions.push(eq(entrepreneurProfiles.fundingStage, fundingStage));
      }
      if (location) {
        entrepreneurConditions.push(eq(entrepreneurProfiles.location, location));
      }
      if (search) {
        entrepreneurConditions.push(
          or(
            like(profiles.bio, `%${search}%`),
            like(entrepreneurProfiles.startupName, `%${search}%`),
            like(entrepreneurProfiles.businessDescription, `%${search}%`)
          )
        );
      }

      const entrepreneurData = await db
        .select({
          id: profiles.id,
          userId: profiles.userId,
          role: profiles.role,
          profilePicture: profiles.profilePicture,
          bio: profiles.bio,
          createdAt: profiles.createdAt,
          updatedAt: profiles.updatedAt,
          userName: user.name,
          userEmail: user.email,
          entrepreneurProfile: {
            id: entrepreneurProfiles.id,
            profileId: entrepreneurProfiles.profileId,
            startupName: entrepreneurProfiles.startupName,
            businessDescription: entrepreneurProfiles.businessDescription,
            industry: entrepreneurProfiles.industry,
            fundingStage: entrepreneurProfiles.fundingStage,
            location: entrepreneurProfiles.location,
            website: entrepreneurProfiles.website,
            createdAt: entrepreneurProfiles.createdAt,
            updatedAt: entrepreneurProfiles.updatedAt,
          }
        })
        .from(profiles)
        .leftJoin(entrepreneurProfiles, eq(profiles.id, entrepreneurProfiles.profileId))
        .leftJoin(user, eq(profiles.userId, user.id))
        .where(and(...entrepreneurConditions))
        .orderBy(desc(profiles.createdAt))
        .limit(limit)
        .offset(offset);
        
      results.push(...entrepreneurData);
    }

    if (!role || role === 'investor') {
      // Optimized: Single query with join to get all data at once
      const investorConditions = [eq(profiles.role, 'investor')];
      
      if (industryFocus) {
        investorConditions.push(eq(investorProfiles.industryFocus, industryFocus));
      }
      if (fundingCapacity) {
        investorConditions.push(eq(investorProfiles.fundingCapacity, fundingCapacity));
      }
      if (location) {
        investorConditions.push(eq(investorProfiles.location, location));
      }
      if (search) {
        investorConditions.push(
          or(
            like(profiles.bio, `%${search}%`),
            like(investorProfiles.investmentPreferences, `%${search}%`)
          )
        );
      }

      const investorData = await db
        .select({
          id: profiles.id,
          userId: profiles.userId,
          role: profiles.role,
          profilePicture: profiles.profilePicture,
          bio: profiles.bio,
          createdAt: profiles.createdAt,
          updatedAt: profiles.updatedAt,
          userName: user.name,
          userEmail: user.email,
          investorProfile: {
            id: investorProfiles.id,
            profileId: investorProfiles.profileId,
            investmentPreferences: investorProfiles.investmentPreferences,
            industryFocus: investorProfiles.industryFocus,
            fundingCapacity: investorProfiles.fundingCapacity,
            location: investorProfiles.location,
            createdAt: investorProfiles.createdAt,
            updatedAt: investorProfiles.updatedAt,
          }
        })
        .from(profiles)
        .leftJoin(investorProfiles, eq(profiles.id, investorProfiles.profileId))
        .leftJoin(user, eq(profiles.userId, user.id))
        .where(and(...investorConditions))
        .orderBy(desc(profiles.createdAt))
        .limit(limit)
        .offset(offset);
        
      results.push(...investorData);
    }

    // Sort combined results by createdAt and apply pagination if querying both roles
    if (!role) {
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      results = results.slice(offset, offset + limit);
    }

    // Add caching headers
    const response = NextResponse.json(results, { status: 200 });
    response.headers.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    
    return response;

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}