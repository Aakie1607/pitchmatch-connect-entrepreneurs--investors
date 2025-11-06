import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { videos, profiles } from '@/db/schema';
import { eq, desc, asc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  try {
    const { profileId } = await params;
    
    // Validate profileId is a valid integer
    if (!profileId || isNaN(parseInt(profileId))) {
      return NextResponse.json(
        { 
          error: 'Valid profile ID is required',
          code: 'INVALID_PROFILE_ID' 
        },
        { status: 400 }
      );
    }

    const profileIdInt = parseInt(profileId);

    // Optimized: Check profile existence with indexed lookup
    const profile = await db.select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.id, profileIdInt))
      .limit(1);

    if (profile.length === 0) {
      return NextResponse.json(
        { 
          error: 'Profile not found',
          code: 'PROFILE_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const sort = searchParams.get('sort') ?? 'createdAt';
    const order = searchParams.get('order') ?? 'desc';

    // Validate sort field
    const validSortFields = ['id', 'title', 'duration', 'viewsCount', 'createdAt', 'updatedAt'];
    const sortField = validSortFields.includes(sort) ? sort : 'createdAt';

    // Optimized: Use indexed profileId and createdAt/viewsCount for fast retrieval
    let query = db.select()
      .from(videos)
      .where(eq(videos.profileId, profileIdInt));

    // Apply sorting with indexed fields
    if (order.toLowerCase() === 'asc') {
      query = query.orderBy(asc(videos[sortField as keyof typeof videos]));
    } else {
      query = query.orderBy(desc(videos[sortField as keyof typeof videos]));
    }

    // Apply pagination
    const results = await query.limit(limit).offset(offset);

    // Add caching headers
    const response = NextResponse.json(results, { status: 200 });
    response.headers.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=60');
    
    return response;

  } catch (error) {
    console.error('GET videos error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}