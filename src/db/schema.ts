import { sqliteTable, integer, text, index } from 'drizzle-orm/sqlite-core';



// Auth tables for better-auth
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// Profiles table with indexes
export const profiles = sqliteTable('profiles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().unique().references(() => user.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),
  profilePicture: text('profile_picture'),
  bio: text('bio'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => ({
  userIdIdx: index('profiles_user_id_idx').on(table.userId),
  roleIdx: index('profiles_role_idx').on(table.role),
}));

// Entrepreneur profiles table with indexes
export const entrepreneurProfiles = sqliteTable('entrepreneur_profiles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  profileId: integer('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  startupName: text('startup_name').notNull(),
  businessDescription: text('business_description'),
  industry: text('industry'),
  fundingStage: text('funding_stage'),
  location: text('location'),
  website: text('website'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => ({
  profileIdIdx: index('entrepreneur_profiles_profile_id_idx').on(table.profileId),
  industryIdx: index('entrepreneur_profiles_industry_idx').on(table.industry),
  fundingStageIdx: index('entrepreneur_profiles_funding_stage_idx').on(table.fundingStage),
  locationIdx: index('entrepreneur_profiles_location_idx').on(table.location),
}));

// Investor profiles table with indexes
export const investorProfiles = sqliteTable('investor_profiles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  profileId: integer('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  investmentPreferences: text('investment_preferences'),
  industryFocus: text('industry_focus'),
  fundingCapacity: text('funding_capacity'),
  location: text('location'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => ({
  profileIdIdx: index('investor_profiles_profile_id_idx').on(table.profileId),
  industryFocusIdx: index('investor_profiles_industry_focus_idx').on(table.industryFocus),
  locationIdx: index('investor_profiles_location_idx').on(table.location),
}));

// Videos table with indexes
export const videos = sqliteTable('videos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  profileId: integer('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  videoUrl: text('video_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  duration: integer('duration'),
  viewsCount: integer('views_count').notNull().default(0),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => ({
  profileIdIdx: index('videos_profile_id_idx').on(table.profileId),
  createdAtIdx: index('videos_created_at_idx').on(table.createdAt),
  viewsCountIdx: index('videos_views_count_idx').on(table.viewsCount),
}));

// Connections table with indexes
export const connections = sqliteTable('connections', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  requesterId: integer('requester_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  recipientId: integer('recipient_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('pending'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => ({
  requesterIdIdx: index('connections_requester_id_idx').on(table.requesterId),
  recipientIdIdx: index('connections_recipient_id_idx').on(table.recipientId),
  statusIdx: index('connections_status_idx').on(table.status),
  requesterRecipientIdx: index('connections_requester_recipient_idx').on(table.requesterId, table.recipientId),
}));

// Messages table with indexes
export const messages = sqliteTable('messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  connectionId: integer('connection_id').notNull().references(() => connections.id, { onDelete: 'cascade' }),
  senderId: integer('sender_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
}, (table) => ({
  connectionIdIdx: index('messages_connection_id_idx').on(table.connectionId),
  createdAtIdx: index('messages_created_at_idx').on(table.createdAt),
  connectionCreatedIdx: index('messages_connection_created_idx').on(table.connectionId, table.createdAt),
}));

// Favorites table with indexes
export const favorites = sqliteTable('favorites', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  profileId: integer('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  favoritedProfileId: integer('favorited_profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').notNull(),
}, (table) => ({
  profileIdIdx: index('favorites_profile_id_idx').on(table.profileId),
  favoritedProfileIdIdx: index('favorites_favorited_profile_id_idx').on(table.favoritedProfileId),
  profileFavoritedIdx: index('favorites_profile_favorited_idx').on(table.profileId, table.favoritedProfileId),
}));

// Profile views table with indexes
export const profileViews = sqliteTable('profile_views', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  viewerId: integer('viewer_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  viewedProfileId: integer('viewed_profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').notNull(),
}, (table) => ({
  viewedProfileIdIdx: index('profile_views_viewed_profile_id_idx').on(table.viewedProfileId),
  createdAtIdx: index('profile_views_created_at_idx').on(table.createdAt),
}));

// Video views table with indexes
export const videoViews = sqliteTable('video_views', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  videoId: integer('video_id').notNull().references(() => videos.id, { onDelete: 'cascade' }),
  viewerId: integer('viewer_id').references(() => profiles.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').notNull(),
}, (table) => ({
  videoIdIdx: index('video_views_video_id_idx').on(table.videoId),
}));

// Notifications table with indexes
export const notifications = sqliteTable('notifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  profileId: integer('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  content: text('content').notNull(),
  referenceId: integer('reference_id'),
  isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
}, (table) => ({
  profileIdIdx: index('notifications_profile_id_idx').on(table.profileId),
  isReadIdx: index('notifications_is_read_idx').on(table.isRead),
  createdAtIdx: index('notifications_created_at_idx').on(table.createdAt),
  profileReadIdx: index('notifications_profile_read_idx').on(table.profileId, table.isRead),
}));