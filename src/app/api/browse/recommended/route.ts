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

    // Get current user's profile
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

    // Get all connection profile IDs (both as requester and recipient)
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

    // Get all favorited profile IDs
    const favoritedProfiles = await db.select()
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

    // Build base query for profiles with opposite role
    let baseQuery = db.select()
      .from(profiles)
      .where(eq(profiles.role, targetRole));

    // Apply exclusions if there are any
    if (excludedProfileIds.length > 0) {
      baseQuery = baseQuery.where(
        and(
          eq(profiles.role, targetRole),
          notInArray(profiles.id, excludedProfileIds)
        )
      );
    }

    // Get all candidate profiles
    const candidateProfiles = await baseQuery;

    if (candidateProfiles.length === 0) {
      return NextResponse.json([]);
    }

    const profileIds = candidateProfiles.map(p => p.id);

    // Get role-specific data for all candidates
    let roleSpecificData: any[] = [];

    if (targetRole === 'entrepreneur') {
      roleSpecificData = await db.select()
        .from(entrepreneurProfiles)
        .where(inArray(entrepreneurProfiles.profileId, profileIds));
    } else if (targetRole === 'investor') {
      roleSpecificData = await db.select()
        .from(investorProfiles)
        .where(inArray(investorProfiles.profileId, profileIds));
    }

    // Create a map of role-specific data by profileId
    const roleDataMap = new Map(
      roleSpecificData.map(data => [data.profileId, data])
    );

    // Get user data for all candidate profiles
    const userIds = candidateProfiles.map(p => p.userId);
    const users = await db.select()
      .from(user)
      .where(inArray(user.id, userIds));

    const userMap = new Map(users.map(u => [u.id, u]));

    // Combine profiles with role-specific data and calculate relevance score
    const profilesWithData = candidateProfiles.map(profile => {
      const roleData = roleDataMap.get(profile.id);
      const userData = userMap.get(profile.userId);
      let relevanceScore = 0;

      // Calculate relevance based on matching criteria
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

      return {
        ...profile,
        name: userData?.name,
        email: userData?.email,
        image: userData?.image,
        ...(roleData || {}),
        relevanceScore,
      };
    });

    // Sort by relevance score (highest first), then by createdAt (newest first)
    profilesWithData.sort((a, b) => {
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Apply pagination
    const paginatedProfiles = profilesWithData.slice(offset, offset + limit);

    // Remove relevance score from response
    const results = paginatedProfiles.map(({ relevanceScore, ...profile }) => profile);

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error('GET recommendations error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}