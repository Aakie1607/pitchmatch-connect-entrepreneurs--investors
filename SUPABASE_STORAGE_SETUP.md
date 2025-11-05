# Supabase Storage Setup Guide

## Video Upload Storage Configuration

To enable video uploads in PitchMatch, you need to configure a Supabase storage bucket.

### Step 1: Create Storage Bucket

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click **New Bucket**
5. Configure the bucket:
   - **Name**: `pitch-videos`
   - **Public bucket**: ✅ Enable (so videos can be accessed via public URLs)
   - **File size limit**: 500 MB (or higher if needed)
   - **Allowed MIME types**: video/mp4, video/quicktime, video/x-msvideo, video/x-matroska, video/webm

### Step 2: Configure Storage Policies

After creating the bucket, set up the following policies:

#### Policy 1: Allow Authenticated Users to Upload
```sql
CREATE POLICY "Allow authenticated users to upload videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pitch-videos' AND
  (storage.foldername(name))[1] = 'videos'
);
```

#### Policy 2: Allow Public Access to Videos
```sql
CREATE POLICY "Allow public access to videos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'pitch-videos');
```

#### Policy 3: Allow Users to Delete Their Own Videos
```sql
CREATE POLICY "Allow users to delete their own videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'pitch-videos' AND
  (storage.foldername(name))[1] = 'videos'
);
```

### Step 3: Verify Configuration

1. The bucket should be listed under **Storage** in your Supabase dashboard
2. Test by uploading a video through the PitchMatch app
3. Check that the video appears in the bucket under the `videos/` folder

### Bucket Structure

Videos will be stored in the following structure:
```
pitch-videos/
└── videos/
    ├── {profileId}-{timestamp}.mp4
    ├── {profileId}-{timestamp}.mov
    └── ...
```

### Environment Variables

Ensure these are set in your `.env` file:
```env
NEXT_PUBLIC_SUPABASE_URL=https://nirziyviytqbofzissrw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pcnppeXZpeXF0Ym9memlzc3J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5ODk0NTcsImV4cCI6MjA3NzU2NTQ1N30.oTnwU-1APvkcK5MQt6tWgTkkVeUQ-LcuLWmAOZEOI0Y
```

### Troubleshooting

**Error: "Storage bucket not configured"**
- Make sure the `pitch-videos` bucket exists in your Supabase project
- Verify the bucket is set to public
- Check that the storage policies are properly configured

**Error: "Permission denied"**
- Ensure the storage policies allow authenticated users to upload
- Verify the user is authenticated (bearer token is valid)
- Check that the file path follows the correct pattern

**Error: "File too large"**
- The default limit is 500MB
- Adjust the bucket's file size limit in Supabase dashboard if needed
- Consider implementing video compression on the client side

### Video Upload Limits

Current configuration:
- **Maximum file size**: 500 MB
- **Minimum duration**: 3 seconds
- **Supported formats**: MP4, MOV, AVI, MKV, WebM
- **Storage location**: Supabase Storage bucket `pitch-videos`

### Alternative: Use Signed URLs for Private Videos

If you want videos to be private (not publicly accessible), you can:

1. Make the bucket private
2. Generate signed URLs when serving videos
3. Update the video URL retrieval logic to use signed URLs:

```typescript
const { data, error } = await supabase.storage
  .from('pitch-videos')
  .createSignedUrl(filePath, 3600); // 1 hour expiry
```

This approach provides more security but requires additional backend logic to generate URLs on-demand.
