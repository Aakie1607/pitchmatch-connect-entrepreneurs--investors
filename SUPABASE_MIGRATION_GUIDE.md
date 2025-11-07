# 🚀 Supabase Postgres Migration Guide

## Migration Completed ✅

Your PitchMatch application has been migrated from Turso (LibSQL) to **Supabase Postgres**!

---

## 📋 What Was Changed

### 1. **Database Client Updated**
- **Before:** `drizzle-orm/libsql` with Turso
- **After:** `drizzle-orm/postgres-js` with Supabase Postgres

### 2. **Configuration Files Updated**
- `src/db/index.ts` - Updated to use Postgres client
- `drizzle.config.ts` - Changed dialect from 'turso' to 'postgresql'
- `.env` - Added `DATABASE_URL` for Supabase connection

### 3. **Packages Installed**
```bash
✅ postgres@3.4.7
✅ @neondatabase/serverless@1.0.2
```

---

## 🔧 Setup Instructions

### Step 1: Get Your Supabase Database Password

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: `vsghipnvyuanzjldovdt`
3. Navigate to **Settings** → **Database**
4. Find **Connection String** section
5. Select **Connection pooling** → **Transaction Mode**
6. Copy the connection string (it will look like):
   ```
   postgresql://postgres.vsghipnvyuanzjldovdt:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
   ```

### Step 2: Update Your .env File

Replace `[YOUR-PASSWORD]` in the `.env` file with your actual database password:

```env
DATABASE_URL=postgresql://postgres.vsghipnvyuanzjldovdt:YOUR_ACTUAL_PASSWORD@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

⚠️ **IMPORTANT:** Keep this password secret and never commit it to version control!

---

## 🗄️ Database Schema Migration

### Option 1: Push Schema to Supabase (Recommended for Development)

Run this command to create all tables in your Supabase database:

```bash
bun drizzle-kit push
```

This will create all tables with the existing schema.

### Option 2: Generate and Run Migrations (Recommended for Production)

```bash
# Generate migration files
bun drizzle-kit generate

# Apply migrations to database
bun drizzle-kit migrate
```

---

## 📊 Your Database Schema

The following tables will be created in Supabase Postgres:

### **Authentication Tables**
- `user` - User accounts
- `session` - Active sessions
- `account` - OAuth providers (Google)
- `verification` - Email verification tokens

### **Core Application Tables**
- `profiles` - User profiles (entrepreneur/investor)
- `entrepreneur_profiles` - Startup information
- `investor_profiles` - Investment preferences
- `videos` - Pitch videos
- `connections` - User connections
- `messages` - Chat messages
- `favorites` - Saved profiles
- `notifications` - Activity notifications
- `profile_views` - Profile view tracking
- `video_views` - Video analytics

### **Indexes**
- 20+ optimized indexes for fast queries
- Composite indexes for complex operations

---

## 🔍 Verify Migration

### Check Database Connection

```bash
# Test database connection
bun drizzle-kit studio
```

This opens Drizzle Studio where you can view your Supabase database.

### Access Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Table Editor**
4. You should see all your tables after running migrations

---

## 🎯 Benefits of Supabase Postgres

### ✅ **Advantages Over Turso**

1. **Better Performance**
   - Optimized for complex queries
   - Native PostgreSQL features
   - Built-in connection pooling

2. **Unified Platform**
   - Database + Storage in one place
   - No need for separate services
   - Simplified infrastructure

3. **Advanced Features**
   - Row-level security (RLS)
   - Realtime subscriptions
   - PostGIS for location data
   - Full-text search

4. **Developer Experience**
   - Excellent dashboard UI
   - Built-in SQL editor
   - API auto-generation
   - Comprehensive logging

5. **Scalability**
   - Auto-scaling compute
   - Read replicas support
   - Backup and restore
   - Point-in-time recovery

---

## 🚨 Important Notes

### Database URL Format

```
postgresql://[USER].[PROJECT]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]
```

**Example:**
```
postgresql://postgres.vsghipnvyuanzjldovdt:MySecurePassword123@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

### Connection Modes

**Transaction Mode (Recommended):** Port `6543`
- Best for serverless/edge functions
- Connection pooling enabled
- Lower latency

**Session Mode:** Port `5432`
- For long-lived connections
- No connection pooling
- Direct connection

**Current Setup:** Using Transaction Mode (Port 6543) ✅

---

## 🔄 Migration Checklist

- [x] Install Postgres packages
- [x] Update database client configuration
- [x] Update Drizzle config for PostgreSQL
- [x] Add DATABASE_URL to .env
- [ ] **ACTION REQUIRED:** Add your Supabase password to .env
- [ ] **ACTION REQUIRED:** Run `bun drizzle-kit push` to create tables
- [ ] **ACTION REQUIRED:** Verify tables in Supabase Dashboard

---

## 🆘 Troubleshooting

### Issue: "Connection refused"
**Solution:** Check that DATABASE_URL has the correct password

### Issue: "SSL connection required"
**Solution:** Add `?sslmode=require` to your DATABASE_URL

### Issue: "Too many connections"
**Solution:** Use connection pooling port (6543) instead of direct port (5432)

### Issue: "Schema not found"
**Solution:** Run `bun drizzle-kit push` to create tables

---

## 📞 Support

- **Supabase Docs:** https://supabase.com/docs/guides/database
- **Drizzle ORM Docs:** https://orm.drizzle.team/docs/get-started-postgresql
- **Supabase Dashboard:** https://supabase.com/dashboard/project/vsghipnvyuanzjldovdt

---

## ✨ Next Steps

1. Add your Supabase database password to `.env`
2. Run `bun drizzle-kit push` to create all tables
3. Restart your development server: `bun dev`
4. Test your application - all features should work seamlessly!

Your data infrastructure is now powered by Supabase Postgres! 🎉
