import { pgTable, serial, text, varchar, timestamp, boolean, integer, index, uuid } from 'drizzle-orm/pg-core';



// Auth tables for better-auth
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Profiles table with indexes
export const profiles = pgTable('profiles', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().unique().references(() => user.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),
  profilePicture: text('profile_picture'),
  bio: text('bio'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('profiles_user_id_idx').on(table.userId),
  roleIdx: index('profiles_role_idx').on(table.role),
}));

// Entrepreneur profiles table with indexes
export const entrepreneurProfiles = pgTable('entrepreneur_profiles', {
  id: serial('id').primaryKey(),
  profileId: integer('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  startupName: text('startup_name').notNull(),
  businessDescription: text('business_description'),
  industry: text('industry'),
  fundingStage: text('funding_stage'),
  location: text('location'),
  website: text('website'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  profileIdIdx: index('entrepreneur_profiles_profile_id_idx').on(table.profileId),
  industryIdx: index('entrepreneur_profiles_industry_idx').on(table.industry),
  fundingStageIdx: index('entrepreneur_profiles_funding_stage_idx').on(table.fundingStage),
  locationIdx: index('entrepreneur_profiles_location_idx').on(table.location),
}));

// Investor profiles table with indexes
export const investorProfiles = pgTable('investor_profiles', {
  id: serial('id').primaryKey(),
  profileId: integer('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  investmentPreferences: text('investment_preferences'),
  industryFocus: text('industry_focus'),
  fundingCapacity: text('funding_capacity'),
  location: text('location'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  profileIdIdx: index('investor_profiles_profile_id_idx').on(table.profileId),
  industryFocusIdx: index('investor_profiles_industry_focus_idx').on(table.industryFocus),
  locationIdx: index('investor_profiles_location_idx').on(table.location),
}));

// Videos table with indexes
export const videos = pgTable('videos', {
  id: serial('id').primaryKey(),
  profileId: integer('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  videoUrl: text('video_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  duration: integer('duration'),
  viewsCount: integer('views_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  profileIdIdx: index('videos_profile_id_idx').on(table.profileId),
  createdAtIdx: index('videos_created_at_idx').on(table.createdAt),
  viewsCountIdx: index('videos_views_count_idx').on(table.viewsCount),
}));

// Connections table with indexes
export const connections = pgTable('connections', {
  id: serial('id').primaryKey(),
  requesterId: integer('requester_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  recipientId: integer('recipient_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  requesterIdIdx: index('connections_requester_id_idx').on(table.requesterId),
  recipientIdIdx: index('connections_recipient_id_idx').on(table.recipientId),
  statusIdx: index('connections_status_idx').on(table.status),
  requesterRecipientIdx: index('connections_requester_recipient_idx').on(table.requesterId, table.recipientId),
}));

// Messages table with indexes
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  connectionId: integer('connection_id').notNull().references(() => connections.id, { onDelete: 'cascade' }),
  senderId: integer('sender_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  connectionIdIdx: index('messages_connection_id_idx').on(table.connectionId),
  createdAtIdx: index('messages_created_at_idx').on(table.createdAt),
  connectionCreatedIdx: index('messages_connection_created_idx').on(table.connectionId, table.createdAt),
}));

// Favorites table with indexes
export const favorites = pgTable('favorites', {
  id: serial('id').primaryKey(),
  profileId: integer('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  favoritedProfileId: integer('favorited_profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  profileIdIdx: index('favorites_profile_id_idx').on(table.profileId),
  favoritedProfileIdIdx: index('favorites_favorited_profile_id_idx').on(table.favoritedProfileId),
  profileFavoritedIdx: index('favorites_profile_favorited_idx').on(table.profileId, table.favoritedProfileId),
}));

// Profile views table with indexes
export const profileViews = pgTable('profile_views', {
  id: serial('id').primaryKey(),
  viewerId: integer('viewer_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  viewedProfileId: integer('viewed_profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  viewedProfileIdIdx: index('profile_views_viewed_profile_id_idx').on(table.viewedProfileId),
  createdAtIdx: index('profile_views_created_at_idx').on(table.createdAt),
}));

// Video views table with indexes
export const videoViews = pgTable('video_views', {
  id: serial('id').primaryKey(),
  videoId: integer('video_id').notNull().references(() => videos.id, { onDelete: 'cascade' }),
  viewerId: integer('viewer_id').references(() => profiles.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  videoIdIdx: index('video_views_video_id_idx').on(table.videoId),
}));

// Notifications table with indexes
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  profileId: integer('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  content: text('content').notNull(),
  referenceId: integer('reference_id'),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  profileIdIdx: index('notifications_profile_id_idx').on(table.profileId),
  isReadIdx: index('notifications_is_read_idx').on(table.isRead),
  createdAtIdx: index('notifications_created_at_idx').on(table.createdAt),
  profileReadIdx: index('notifications_profile_read_idx').on(table.profileId, table.isRead),
}));