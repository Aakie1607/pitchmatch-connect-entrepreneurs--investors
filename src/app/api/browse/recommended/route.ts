import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { profiles, entrepreneurProfiles, investorProfiles, connections, favorites, user } from '@/db/schema';
import { eq, and, or, notInArray, inArray, ne } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const userId = session.user.id;

    // Optimized: Get current user's profile using indexed userId
    const userProfile = await db.select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    if (userProfile.length === 0) {
      return NextResponse.json({ 
        error: 'User profile not found',
        code: 'PROFILE_NOT_FOUND' 
      }, { status: 404 });
    }

    const currentProfile = userProfile[0];
    const currentProfileId = currentProfile.id;
    const currentRole = currentProfile.role;

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Determine target role (opposite of current user's role)
    const targetRole = currentRole === 'entrepreneur' ? 'investor' : 'entrepreneur';

    // Optimized: Get all connection profile IDs using indexed fields
    const existingConnections = await db.select({
      profileId: connections.requesterId,
    })
      .from(connections)
      .where(eq(connections.recipientId, currentProfileId))
      .union(
        db.select({
          profileId: connections.recipientId,
        })
          .from(connections)
          .where(eq(connections.requesterId, currentProfileId))
      );

    const connectedProfileIds = existingConnections.map(c => c.profileId);

    // Optimized: Get all favorited profile IDs using indexed profileId
    const favoritedProfiles = await db.select({ favoritedProfileId: favorites.favoritedProfileId })
      .from(favorites)
      .where(eq(favorites.profileId, currentProfileId));

    const favoritedProfileIds = favoritedProfiles.map(f => f.favoritedProfileId);

    // Combine exclusion lists
    const excludedProfileIds = [...new Set([...connectedProfileIds, ...favoritedProfileIds, currentProfileId])];

    // Get current user's role-specific profile for matching
    let matchingCriteria: { industry?: string; location?: string } = {};

    if (currentRole === 'entrepreneur') {
      const entrepreneurProfile = await db.select()
        .from(entrepreneurProfiles)
        .where(eq(entrepreneurProfiles.profileId, currentProfileId))
        .limit(1);

      if (entrepreneurProfile.length > 0) {
        matchingCriteria = {
          industry: entrepreneurProfile[0].industry || undefined,
          location: entrepreneurProfile[0].location || undefined,
        };
      }
    } else if (currentRole === 'investor') {
      const investorProfile = await db.select()
        .from(investorProfiles)
        .where(eq(investorProfiles.profileId, currentProfileId))
        .limit(1);

      if (investorProfile.length > 0) {
        matchingCriteria = {
          industry: investorProfile[0].industryFocus || undefined,
          location: investorProfile[0].location || undefined,
        };
      }
    }

    // Optimized: Build single query with all joins to fetch profiles with role-specific data
    let baseConditions = [eq(profiles.role, targetRole)];
    if (excludedProfileIds.length > 0) {
      baseConditions.push(notInArray(profiles.id, excludedProfileIds));
    }

    let candidateProfiles;
    
    if (targetRole === 'entrepreneur') {
      candidateProfiles = await db.select({
        id: profiles.id,
        userId: profiles.userId,
        role: profiles.role,
        profilePicture: profiles.profilePicture,
        bio: profiles.bio,
        createdAt: profiles.createdAt,
        updatedAt: profiles.updatedAt,
        userName: user.name,
        userEmail: user.email,
        roleData: {
          industry: entrepreneurProfiles.industry,
          location: entrepreneurProfiles.location,
          startupName: entrepreneurProfiles.startupName,
          businessDescription: entrepreneurProfiles.businessDescription,
          fundingStage: entrepreneurProfiles.fundingStage,
          website: entrepreneurProfiles.website,
        }
      })
        .from(profiles)
        .leftJoin(entrepreneurProfiles, eq(profiles.id, entrepreneurProfiles.profileId))
        .leftJoin(user, eq(profiles.userId, user.id))
        .where(and(...baseConditions));
    } else {
      candidateProfiles = await db.select({
        id: profiles.id,
        userId: profiles.userId,
        role: profiles.role,
        profilePicture: profiles.profilePicture,
        bio: profiles.bio,
        createdAt: profiles.createdAt,
        updatedAt: profiles.updatedAt,
        userName: user.name,
        userEmail: user.email,
        roleData: {
          industryFocus: investorProfiles.industryFocus,
          location: investorProfiles.location,
          investmentPreferences: investorProfiles.investmentPreferences,
          fundingCapacity: investorProfiles.fundingCapacity,
        }
      })
        .from(profiles)
        .leftJoin(investorProfiles, eq(profiles.id, investorProfiles.profileId))
        .leftJoin(user, eq(profiles.userId, user.id))
        .where(and(...baseConditions));
    }

    if (candidateProfiles.length === 0) {
      return NextResponse.json([]);
    }

    // Calculate relevance score and sort
    const profilesWithScore = candidateProfiles.map(profile => {
      let relevanceScore = 0;
      const roleData = profile.roleData;

      if (roleData) {
        const candidateIndustry = targetRole === 'entrepreneur' 
          ? roleData.industry 
          : roleData.industryFocus;
        const candidateLocation = roleData.location;

        // Industry match
        if (matchingCriteria.industry && candidateIndustry) {
          if (candidateIndustry.toLowerCase() === matchingCriteria.industry.toLowerCase()) {
            relevanceScore += 2;
          } else if (candidateIndustry.toLowerCase().includes(matchingCriteria.industry.toLowerCase()) ||
                     matchingCriteria.industry.toLowerCase().includes(candidateIndustry.toLowerCase())) {
            relevanceScore += 1;
          }
        }

        // Location match
        if (matchingCriteria.location && candidateLocation) {
          if (candidateLocation.toLowerCase() === matchingCriteria.location.toLowerCase()) {
            relevanceScore += 2;
          } else if (candidateLocation.toLowerCase().includes(matchingCriteria.location.toLowerCase()) ||
                     matchingCriteria.location.toLowerCase().includes(candidateLocation.toLowerCase())) {
            relevanceScore += 1;
          }
        }
      }

      return { ...profile, relevanceScore };
    });

    // Sort by relevance score (highest first), then by createdAt (newest first)
    profilesWithScore.sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Apply pagination
    const paginatedProfiles = profilesWithScore.slice(offset, offset + limit);

    // Remove relevance score from response
    const results = paginatedProfiles.map(({ relevanceScore, ...profile }) => profile);

    // Add caching headers
    const response = NextResponse.json(results, { status: 200 });
    response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=60');
    
    return response;

  } catch (error) {
    console.error('GET recommendations error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}