import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { profiles, videos } from '@/db/schema';
import { eq } from 'drizzle-orm';

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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const profileId = formData.get('profileId') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;

    // Validate required fields
    if (!file) {
      return NextResponse.json({ 
        error: 'Video file is required',
        code: 'MISSING_FILE' 
      }, { status: 400 });
    }

    if (!profileId) {
      return NextResponse.json({ 
        error: 'Profile ID is required',
        code: 'MISSING_PROFILE_ID' 
      }, { status: 400 });
    }

    if (!title || title.trim() === '') {
      return NextResponse.json({ 
        error: 'Video title is required',
        code: 'MISSING_TITLE' 
      }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      return NextResponse.json({ 
        error: 'File must be a video',
        code: 'INVALID_FILE_TYPE' 
      }, { status: 400 });
    }

    // Validate file size (500MB max)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'Video file must be under 500MB',
        code: 'FILE_TOO_LARGE' 
      }, { status: 400 });
    }

    // Validate title content
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('test') || lowerTitle.includes('lorem') || lowerTitle === 'untitled') {
      return NextResponse.json({ 
        error: 'Please provide a meaningful title for your video',
        code: 'INVALID_TITLE' 
      }, { status: 400 });
    }

    // Parse and validate profileId
    const parsedProfileId = parseInt(profileId);
    if (isNaN(parsedProfileId)) {
      return NextResponse.json({ 
        error: 'Invalid profile ID',
        code: 'INVALID_PROFILE_ID' 
      }, { status: 400 });
    }

    // Verify profile ownership
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
        error: 'You do not have permission to upload videos for this profile',
        code: 'FORBIDDEN' 
      }, { status: 403 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${parsedProfileId}-${Date.now()}.${fileExt}`;
    const filePath = `videos/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('pitch-videos')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      
      // Check if bucket doesn't exist
      if (uploadError.message.includes('not found') || uploadError.message.includes('does not exist')) {
        return NextResponse.json({ 
          error: 'Storage bucket not configured. Please contact support.',
          code: 'STORAGE_NOT_CONFIGURED' 
        }, { status: 500 });
      }

      return NextResponse.json({ 
        error: 'Failed to upload video: ' + uploadError.message,
        code: 'UPLOAD_FAILED' 
      }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('pitch-videos')
      .getPublicUrl(filePath);

    if (!urlData.publicUrl) {
      return NextResponse.json({ 
        error: 'Failed to generate video URL',
        code: 'URL_GENERATION_FAILED' 
      }, { status: 500 });
    }

    // Create video record in database
    const videoData = {
      profileId: parsedProfileId,
      title: title.trim(),
      description: description?.trim() || null,
      videoUrl: urlData.publicUrl,
      viewsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newVideo = await db.insert(videos)
      .values(videoData)
      .returning();

    return NextResponse.json({
      success: true,
      video: newVideo[0],
      message: 'Video uploaded successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message,
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
