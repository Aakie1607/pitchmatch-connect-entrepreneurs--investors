import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { videos, profiles } from '@/db/schema';
import { eq, like, and, or, desc, asc } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const body = await request.json();
    const { profileId, title, videoUrl, description, thumbnailUrl, duration } = body;

    // Validate required fields
    if (!profileId) {
      return NextResponse.json({ 
        error: 'profileId is required',
        code: 'MISSING_PROFILE_ID' 
      }, { status: 400 });
    }

    if (!title || title.trim() === '') {
      return NextResponse.json({ 
        error: 'title is required',
        code: 'MISSING_TITLE' 
      }, { status: 400 });
    }

    if (!videoUrl || videoUrl.trim() === '') {
      return NextResponse.json({ 
        error: 'videoUrl is required',
        code: 'MISSING_VIDEO_URL' 
      }, { status: 400 });
    }

    // Validate profileId is a valid integer
    const parsedProfileId = parseInt(profileId);
    if (isNaN(parsedProfileId)) {
      return NextResponse.json({ 
        error: 'profileId must be a valid integer',
        code: 'INVALID_PROFILE_ID' 
      }, { status: 400 });
    }

    // Verify the profile exists and belongs to the authenticated user
    const profile = await db.select()
      .from(profiles)
      .where(eq(profiles.id, parsedProfileId))
      .limit(1);

    if (profile.length === 0) {
      return NextResponse.json({ 
        error: 'Profile not found',
        code: 'PROFILE_NOT_FOUND' 
      }, { status: 404 });
    }

    if (profile[0].userId !== session.user.id) {
      return NextResponse.json({ 
        error: 'You do not have permission to create videos for this profile',
        code: 'FORBIDDEN' 
      }, { status: 403 });
    }

    // Validate duration if provided
    if (duration !== undefined && duration !== null) {
      const parsedDuration = parseInt(duration);
      if (isNaN(parsedDuration) || parsedDuration < 0) {
        return NextResponse.json({ 
          error: 'duration must be a valid positive integer (in seconds)',
          code: 'INVALID_DURATION' 
        }, { status: 400 });
      }
    }

    // Prepare video data
    const videoData: any = {
      profileId: parsedProfileId,
      title: title.trim(),
      videoUrl: videoUrl.trim(),
      viewsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (description) {
      videoData.description = description.trim();
    }

    if (thumbnailUrl) {
      videoData.thumbnailUrl = thumbnailUrl.trim();
    }

    if (duration !== undefined && duration !== null) {
      videoData.duration = parseInt(duration);
    }

    // Insert video
    const newVideo = await db.insert(videos)
      .values(videoData)
      .returning();

    return NextResponse.json(newVideo[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse pagination parameters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    
    // Parse filter parameters
    const profileIdParam = searchParams.get('profileId');
    const search = searchParams.get('search');
    
    // Parse sort parameters
    const sortField = searchParams.get('sort') ?? 'createdAt';
    const sortOrder = searchParams.get('order') ?? 'desc';

    // Validate sort field
    const allowedSortFields = ['createdAt', 'viewsCount'];
    if (!allowedSortFields.includes(sortField)) {
      return NextResponse.json({ 
        error: 'Invalid sort field. Allowed values: createdAt, viewsCount',
        code: 'INVALID_SORT_FIELD' 
      }, { status: 400 });
    }

    // Validate sort order
    if (sortOrder !== 'asc' && sortOrder !== 'desc') {
      return NextResponse.json({ 
        error: 'Invalid sort order. Allowed values: asc, desc',
        code: 'INVALID_SORT_ORDER' 
      }, { status: 400 });
    }

    // Build query
    let query = db.select().from(videos);

    // Build where conditions
    const whereConditions = [];

    // Optimized: Filter by profileId using indexed field
    if (profileIdParam) {
      const parsedProfileId = parseInt(profileIdParam);
      if (isNaN(parsedProfileId)) {
        return NextResponse.json({ 
          error: 'profileId must be a valid integer',
          code: 'INVALID_PROFILE_ID' 
        }, { status: 400 });
      }
      whereConditions.push(eq(videos.profileId, parsedProfileId));
    }

    // Search in title and description if search query provided
    if (search && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      const searchCondition = or(
        like(videos.title, searchTerm),
        like(videos.description, searchTerm)
      );
      whereConditions.push(searchCondition);
    }

    // Apply where conditions
    if (whereConditions.length > 0) {
      query = query.where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions));
    }

    // Optimized: Apply sorting using indexed fields (createdAt, viewsCount)
    const sortColumn = sortField === 'createdAt' ? videos.createdAt : videos.viewsCount;
    query = query.orderBy(sortOrder === 'desc' ? desc(sortColumn) : asc(sortColumn));

    // Apply pagination
    const results = await query.limit(limit).offset(offset);

    // Add caching headers
    const response = NextResponse.json(results, { status: 200 });
    response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=60');
    
    return response;

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}