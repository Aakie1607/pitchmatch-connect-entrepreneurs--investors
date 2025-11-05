import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { profiles, profileViews, connections, videos, favorites } from '@/db/schema';
import { eq, and, or, gte, desc, sql } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const profileId = parseInt(id);

    // Validate profileId
    if (!profileId || isNaN(profileId)) {
      return NextResponse.json(
        { 
          error: 'Valid profile ID is required',
          code: 'INVALID_PROFILE_ID' 
        },
        { status: 400 }
      );
    }

    // Check if profile exists
    const profile = await db.select()
      .from(profiles)
      .where(eq(profiles.id, profileId))
      .limit(1);

    if (profile.length === 0) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get('timeRange') ?? 'all';

    // Calculate date filter based on timeRange
    let dateFilter: Date | null = null;
    if (timeRange === '7d') {
      dateFilter = new Date();
      dateFilter.setDate(dateFilter.getDate() - 7);
    } else if (timeRange === '30d') {
      dateFilter = new Date();
      dateFilter.setDate(dateFilter.getDate() - 30);
    }

    // 1. Total Profile Views
    let totalProfileViewsQuery = db.select({ count: sql<number>`count(*)` })
      .from(profileViews)
      .where(eq(profileViews.viewedProfileId, profileId));

    if (dateFilter) {
      totalProfileViewsQuery = db.select({ count: sql<number>`count(*)` })
        .from(profileViews)
        .where(
          and(
            eq(profileViews.viewedProfileId, profileId),
            gte(profileViews.createdAt, dateFilter.toISOString())
          )
        );
    }

    const totalProfileViewsResult = await totalProfileViewsQuery;
    const totalProfileViews = totalProfileViewsResult[0]?.count ?? 0;

    // 2. Total Connections (accepted)
    const totalConnectionsResult = await db.select({ count: sql<number>`count(*)` })
      .from(connections)
      .where(
        and(
          or(
            eq(connections.requesterId, profileId),
            eq(connections.recipientId, profileId)
          ),
          eq(connections.status, 'accepted')
        )
      );
    const totalConnections = totalConnectionsResult[0]?.count ?? 0;

    // 3. Pending Connection Requests
    const pendingConnectionRequestsResult = await db.select({ count: sql<number>`count(*)` })
      .from(connections)
      .where(
        and(
          eq(connections.recipientId, profileId),
          eq(connections.status, 'pending')
        )
      );
    const pendingConnectionRequests = pendingConnectionRequestsResult[0]?.count ?? 0;

    // 4. Total Video Uploads
    const totalVideoUploadsResult = await db.select({ count: sql<number>`count(*)` })
      .from(videos)
      .where(eq(videos.profileId, profileId));
    const totalVideoUploads = totalVideoUploadsResult[0]?.count ?? 0;

    // 5. Total Video Views (sum of viewsCount)
    const totalVideoViewsResult = await db.select({ 
      total: sql<number>`COALESCE(sum(${videos.viewsCount}), 0)` 
    })
      .from(videos)
      .where(eq(videos.profileId, profileId));
    const totalVideoViews = totalVideoViewsResult[0]?.total ?? 0;

    // 6. Favorited By Count
    const favoritedByCountResult = await db.select({ count: sql<number>`count(*)` })
      .from(favorites)
      .where(eq(favorites.favoritedProfileId, profileId));
    const favoritedByCount = favoritedByCountResult[0]?.count ?? 0;

    // 7. Recent Profile Views (last 10 with viewer details)
    let recentViewsQuery = db.select({
      id: profileViews.id,
      viewerId: profileViews.viewerId,
      createdAt: profileViews.createdAt,
      viewerName: profiles.userId,
      viewerProfilePicture: profiles.profilePicture,
      viewerRole: profiles.role
    })
      .from(profileViews)
      .innerJoin(profiles, eq(profileViews.viewerId, profiles.id))
      .where(eq(profileViews.viewedProfileId, profileId))
      .orderBy(desc(profileViews.createdAt))
      .limit(10);

    if (dateFilter) {
      recentViewsQuery = db.select({
        id: profileViews.id,
        viewerId: profileViews.viewerId,
        createdAt: profileViews.createdAt,
        viewerName: profiles.userId,
        viewerProfilePicture: profiles.profilePicture,
        viewerRole: profiles.role
      })
        .from(profileViews)
        .innerJoin(profiles, eq(profileViews.viewerId, profiles.id))
        .where(
          and(
            eq(profileViews.viewedProfileId, profileId),
            gte(profileViews.createdAt, dateFilter.toISOString())
          )
        )
        .orderBy(desc(profileViews.createdAt))
        .limit(10);
    }

    const recentProfileViews = await recentViewsQuery;

    // Construct analytics response
    const analytics = {
      profileId,
      timeRange,
      totalProfileViews,
      totalConnections,
      pendingConnectionRequests,
      totalVideoUploads,
      totalVideoViews,
      favoritedByCount,
      recentProfileViews: recentProfileViews.map(view => ({
        id: view.id,
        viewerId: view.viewerId,
        viewerName: view.viewerName,
        viewerProfilePicture: view.viewerProfilePicture,
        viewerRole: view.viewerRole,
        createdAt: view.createdAt
      }))
    };

    return NextResponse.json(analytics, { status: 200 });

  } catch (error) {
    console.error('GET analytics error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}