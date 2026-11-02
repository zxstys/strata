import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, index, uuid, integer, primaryKey } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  about: text("about").notNull().default("About me ..."),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  role: text("role"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  username: text("username").unique(),
  displayUsername: text("display_username"),
  verified: boolean("verified").default(false).notNull(),
  goldPermission: boolean("gold_permission").default(false).notNull(),
  goldEnabled: boolean("gold_enabled").default(false).notNull(),
  banner: text("banner"),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    impersonatedBy: text("impersonated_by"),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

// schema.ts
export const posts = pgTable(
  "posts",
  {
    uuid: uuid("uuid").notNull().unique().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    mediaUrl: text("media_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    pinnedAt: timestamp("pinned_at"),
    editedAt: timestamp("edited_at"),
  },
  (t) => [
    index("posts_created_at_idx").on(t.createdAt),
    index("posts_user_id_idx").on(t.userId),
  ]
);

export const supportTickets = pgTable(
  "support_tickets",
  {
    uuid: uuid("uuid").notNull().unique().defaultRandom(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    contactEmail: text("contact_email"),
    type: text("type").notNull(),
    subject: text("subject").notNull(),
    message: text("message").notNull(),
    status: text("status").notNull().default("open"),
    adminNote: text("admin_note"),
    handledBy: text("handled_by"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("support_status_created_idx").on(t.status, t.createdAt),
    index("support_user_idx").on(t.userId),
    index("support_email_idx").on(t.contactEmail),
  ]
);

export const postLikes = pgTable(
  "post_likes",
  {
    postUuid: uuid("post_uuid")
      .notNull()
      .references(() => posts.uuid, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.postUuid, t.userId] })]
);

export const comments = pgTable(
  "comments",
  {
    uuid: uuid("uuid").notNull().unique().defaultRandom(),
    postUuid: uuid("post_uuid")
      .notNull()
      .references(() => posts.uuid, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    mediaUrl: text("media_url"),
  },
  (t) => [index("comments_post_uuid_idx").on(t.postUuid)]
);

export const follows = pgTable(
  "follows",
  {
    followerId: text("follower_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    followingId: text("following_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.followerId, t.followingId] }),
    index("follows_following_idx").on(t.followingId),
  ]
);

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Sorted "userA:userB". The unique constraint allows one conversation per pair.
    pairKey: text("pair_key").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  },
  (t) => [index("conversations_last_message_idx").on(t.lastMessageAt)]
);

export const conversationMembers = pgTable(
  "conversation_members",
  {
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lastReadAt: timestamp("last_read_at"),
  },
  (t) => [
    primaryKey({ columns: [t.conversationId, t.userId] }),
    index("conv_members_user_idx").on(t.userId),
  ]
);

export const messages = pgTable(
  "messages",
  {
    // Generated in the browser, so a retry after a network error can't create a duplicate.
    id: uuid("id").primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: text("sender_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    mediaUrl: text("media_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("messages_conv_created_idx").on(t.conversationId, t.createdAt)]
);

export const postTags = pgTable(
  "post_tags",
  {
    postUuid: uuid("post_uuid")
      .notNull()
      .references(() => posts.uuid, { onDelete: "cascade" }),
    tag: text("tag").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.postUuid, t.tag] }),
    index("post_tags_tag_created_idx").on(t.tag, t.createdAt),
  ]
);

export const supportMessages = pgTable(
  "support_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ticketUuid: uuid("ticket_uuid")
      .notNull()
      .references(() => supportTickets.uuid, { onDelete: "cascade" }),
    senderId: text("sender_id").references(() => user.id, { onDelete: "set null" }),
    isStaff: boolean("is_staff").notNull().default(false),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("support_messages_ticket_idx").on(t.ticketUuid, t.createdAt)]
);

export const mentions = pgTable(
  "mentions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    postUuid: uuid("post_uuid")
      .notNull()
      .references(() => posts.uuid, { onDelete: "cascade" }),
    // Null for mentions in the post body, set for mentions in a reply.
    commentUuid: uuid("comment_uuid").references(() => comments.uuid, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("mentions_user_idx").on(t.userId),
    index("mentions_post_idx").on(t.postUuid),
  ]
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    actorId: text("actor_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    postUuid: uuid("post_uuid").references(() => posts.uuid, {
      onDelete: "cascade",
    }),
    commentUuid: uuid("comment_uuid").references(() => comments.uuid, {
      onDelete: "cascade",
    }),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("notifications_user_created_idx").on(t.userId, t.createdAt)]
);

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, { fields: [comments.postUuid], references: [posts.uuid] }),
  user: one(user, { fields: [comments.userId], references: [user.id] }),
}));

export const postLikesRelations = relations(postLikes, ({ one }) => ({
  post: one(posts, { fields: [postLikes.postUuid], references: [posts.uuid] }),
  user: one(user, { fields: [postLikes.userId], references: [user.id] }),
}));

export const usersRelations = relations(user, ({ many }) => ({
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  user: one(user, {
    fields: [posts.userId],
    references: [user.id],
  }),
}));

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));
