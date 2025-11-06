# 🚨 Supabase Storage Setup Required for Video Uploads

## Current Issue

The video upload system is currently unable to connect to Supabase Storage. The error indicates:

```
Error: getaddrinfo ENOTFOUND nirziyviytqbofzissrw.supabase.co
```

This means your Supabase project at `nirziyviytqbofzissrw.supabase.co` is not accessible.

---

## ✅ Temporary Workaround Implemented

I've implemented a **graceful fallback system** that allows PitchMatch to continue functioning:

### What Works Now:
- ✅ Profile creation completes successfully
- ✅ Video metadata (title, description) is saved to database
- ✅ Users receive clear feedback about Supabase status
- ✅ App doesn't crash when video upload fails
- ✅ Users can access dashboard and use other features

### What Doesn't Work:
- ❌ Actual video files are not stored (uses placeholder URLs)
- ❌ Videos cannot be played back in the app
- ❌ Video thumbnails are not generated

---

## 🔧 How to Fix (Setup Supabase Storage)

### Option 1: Create a New Supabase Project (Recommended)

1. **Go to [Supabase Dashboard](https://supabase.com/dashboard)**
   
2. **Create a new project**:
   - Click "New Project"
   - Choose organization
   - Enter project name (e.g., "pitchmatch-storage")
   - Set a strong database password
   - Choose region closest to users
   - Wait for provisioning (~2 minutes)

3. **Get your credentials**:
   - Go to Project Settings → API
   - Copy **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - Copy **anon/public key** (starts with `eyJhbG...`)

4. **Create Storage Bucket**:
   - Go to **Storage** in sidebar
   - Click **"New bucket"**
   - Bucket name: `pitch-videos`
   - Set to **Public** (important!)
   - Click "Create bucket"

5. **Set up Storage Policies**:
   - Click on `pitch-videos` bucket
   - Go to **Policies** tab
   - Add the following policies:

   **Upload Policy (INSERT)**:
   ```sql
   CREATE POLICY "Allow authenticated users to upload videos"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'pitch-videos');
   ```

   **Public Read Policy (SELECT)**:
   ```sql
   CREATE POLICY "Allow public to view videos"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'pitch-videos');
   ```

6. **Update your `.env` file**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_NEW_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_new_anon_key_here
   ```

7. **Restart your development server**:
   ```bash
   # Stop the current server
   # Then restart with:
   bun dev
   ```

---

### Option 2: Verify Existing Project

If you believe the project should exist:

1. **Log into [Supabase Dashboard](https://supabase.com/dashboard)**

2. **Check if project exists**:
   - Look for project with reference `nirziyviytqbofzissrw`
   - Check if it's paused or archived

3. **If project exists but paused**:
   - Click "Restore project"
   - Wait for it to restart
   - Follow steps 4-7 from Option 1 above

4. **If project doesn't exist**:
   - Follow Option 1 to create a new project

---

## 🧪 Testing After Setup

Once you've configured Supabase:

1. **Register as an entrepreneur** (or create a new test account)

2. **Complete profile setup** with a real video file

3. **Check for success messages**:
   - Should see "Video uploaded successfully!" (not "metadata saved")
   - Video should be playable in profile/browse sections

4. **Verify in Supabase Dashboard**:
   - Go to Storage → pitch-videos bucket
   - You should see uploaded video files

---

## 📋 Current System Behavior

### With Supabase Configured:
```
User uploads video → File goes to Supabase Storage → Public URL returned → Saved to database → Video plays in app ✅
```

### Without Supabase (Current State):
```
User uploads video → Placeholder URL generated → Saved to database → Warning shown → Profile created ⚠️
```

---

## 🆘 Need Help?

If you encounter issues:

1. **Check Supabase Dashboard** for error logs
2. **Verify bucket name** is exactly `pitch-videos`
3. **Confirm bucket is public**
4. **Check storage policies** are created
5. **Restart dev server** after changing `.env`

---

## 💡 Benefits of Fixing This

Once Supabase is properly configured:

- ✅ Real video uploads and playback
- ✅ Video thumbnails auto-generated
- ✅ CDN-powered fast video delivery
- ✅ Automatic video transcoding (optional)
- ✅ Bandwidth optimization
- ✅ Professional video storage infrastructure

---

## Current Environment Variables

Your current `.env` has:
```
NEXT_PUBLIC_SUPABASE_URL=https://nirziyviytqbofzissrw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Replace these** with your new project credentials once created.
