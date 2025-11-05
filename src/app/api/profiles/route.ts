import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { eq, like, and, or } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
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
    const body = await request.json();
    const { role, profilePicture, bio } = body;

    // Security check: reject if userId provided in body
    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json({ 
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    // Validate required fields
    if (!role) {
      return NextResponse.json({ 
        error: "Role is required",
        code: "MISSING_REQUIRED_FIELD" 
      }, { status: 400 });
    }

    // Validate role value
    if (role !== 'entrepreneur' && role !== 'investor') {
      return NextResponse.json({ 
        error: "Role must be either 'entrepreneur' or 'investor'",
        code: "INVALID_ROLE" 
      }, { status: 400 });
    }

    // Check if profile already exists for this user
    const existingProfile = await db.select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    if (existingProfile.length > 0) {
      return NextResponse.json({ 
        error: "Profile already exists for this user",
        code: "DUPLICATE_PROFILE" 
      }, { status: 400 });
    }

    // Create new profile
    const now = new Date().toISOString();
    const newProfile = await db.insert(profiles)
      .values({
        userId,
        role: role.trim(),
        profilePicture: profilePicture?.trim() || null,
        bio: bio?.trim() || null,
        createdAt: now,
        updatedAt: now
      })
      .returning();

    return NextResponse.json(newProfile[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Pagination parameters
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    
    // Filter parameters
    const roleFilter = searchParams.get('role');
    const search = searchParams.get('search');

    // Build query
    let query = db.select().from(profiles);

    // Apply filters
    const conditions = [];

    if (roleFilter) {
      if (roleFilter !== 'entrepreneur' && roleFilter !== 'investor') {
        return NextResponse.json({ 
          error: "Role filter must be either 'entrepreneur' or 'investor'",
          code: "INVALID_ROLE_FILTER" 
        }, { status: 400 });
      }
      conditions.push(eq(profiles.role, roleFilter));
    }

    if (search) {
      conditions.push(like(profiles.bio, `%${search}%`));
    }

    if (conditions.length > 0) {
      if (conditions.length === 1) {
        query = query.where(conditions[0]);
      } else {
        query = query.where(and(...conditions));
      }
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