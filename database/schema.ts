import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  boolean,
  index,
  int,
  json,
  decimal,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";



export const aiConversation = mysqlTable("ai_conversation", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { fsp: 3 })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const aiMessage = mysqlTable("ai_message", {
  id: varchar("id", { length: 36 }).primaryKey(),
  conversationId: varchar("conversation_id", { length: 36 })
    .notNull()
    .references(() => aiConversation.id, { onDelete: "cascade" }),
  rowPosition: int("row_position").notNull().default(0),
  /** User prompt for this turn. */
  content: text("content").notNull(),
  /** Agent/model reply for this turn. */
  aiFeedback: text("agent_feedback"),
  inputTokens: int("input_tokens").notNull().default(0),
  outputTokens: int("output_tokens").notNull().default(0),
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull().default("0.00"),
  createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { fsp: 3 })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const user = mysqlTable("user", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  role: varchar("role", { length: 50 }).notNull().default("dev"),
  createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { fsp: 3 })
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = mysqlTable(
  "session",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    expiresAt: timestamp("expires_at", { fsp: 3 }).notNull(),
    token: varchar("token", { length: 255 }).notNull().unique(),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { fsp: 3 })
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = mysqlTable(
  "account",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { fsp: 3 }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { fsp: 3 }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { fsp: 3 })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = mysqlTable(
  "verification",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    identifier: varchar("identifier", { length: 255 }).notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { fsp: 3 }).notNull(),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { fsp: 3 })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const skillCategory = mysqlTable("skill_category", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { fsp: 3 })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const skill = mysqlTable("skill", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description").notNull(),
  instructions: text("instructions").notNull(),
  categoryId: varchar("category_id", { length: 36 })
    .notNull()
    .references(() => skillCategory.id, { onDelete: "cascade" }),
  authorId: varchar("author_id", { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { fsp: 3 })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const mcpCategory = mysqlTable(
  "mcp_category",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    slug: varchar("slug", { length: 50 }).notNull().unique(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    displayOrder: int("display_order").default(0).notNull(),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { fsp: 3 })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("mcp_category_slug_idx").on(table.slug)],
);

export const mcpServer = mysqlTable(
  "mcp_server",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description").notNull(),
    categoryId: varchar("category_id", { length: 36 })
      .notNull()
      .references(() => mcpCategory.id, { onDelete: "restrict" }),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    configTemplate: json("config_template").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { fsp: 3 })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("mcp_server_slug_idx").on(table.slug),
    index("mcp_server_categoryId_idx").on(table.categoryId),
    index("mcp_server_userId_idx").on(table.userId),
  ],
);

export const mcpServerTool = mysqlTable(
  "mcp_server_tool",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    mcpServerId: varchar("mcp_server_id", { length: 36 })
      .notNull()
      .references(() => mcpServer.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description").notNull(),
    inputSchema: json("input_schema").$type<Record<string, unknown>>(),
    displayOrder: int("display_order").default(0).notNull(),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
  },
  (table) => [index("mcp_server_tool_serverId_idx").on(table.mcpServerId)],
);

export const googleWorkspaceAuth = mysqlTable(
  "google_workspace_auth",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    refreshTokenEnc: text("refresh_token_enc").notNull(),
    accessTokenEnc: text("access_token_enc"),
    refreshTokenIv: varchar("refresh_token_iv", { length: 32 }).notNull(),
    accessTokenIv: varchar("access_token_iv", { length: 32 }),
    encryptionKeyVersion: int("encryption_key_version").notNull().default(1),
    tokenExpiresAt: timestamp("token_expires_at", { fsp: 3 }),
    calendarEnabled: boolean("calendar_enabled").default(true).notNull(),
    emailEnabled: boolean("email_enabled").default(true).notNull(),
    meetEnabled: boolean("meet_enabled").default(true).notNull(),
    createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { fsp: 3 })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("google_workspace_auth_userId_idx").on(table.userId)],
);

export const userRelations = relations(user, ({ many, one }) => ({
  mcpServers: many(mcpServer),
  skills: many(skill),
  googleWorkspaceAuth: one(googleWorkspaceAuth),
  settings: one(userSettings),
  managedTeams: many(team),
  teams: many(userTeam),
}));

export const googleWorkspaceAuthRelations = relations(googleWorkspaceAuth, ({ one }) => ({
  user: one(user, {
    fields: [googleWorkspaceAuth.userId],
    references: [user.id],
  }),
}));

export const skillCategoryRelations = relations(skillCategory, ({ many }) => ({
  skills: many(skill),
}));

export const skillRelations = relations(skill, ({ one }) => ({
  category: one(skillCategory, {
    fields: [skill.categoryId],
    references: [skillCategory.id],
  }),
  author: one(user, {
    fields: [skill.authorId],
    references: [user.id],
  }),
}));

export const mcpCategoryRelations = relations(mcpCategory, ({ many }) => ({
  servers: many(mcpServer),
}));

export const mcpServerRelations = relations(mcpServer, ({ one, many }) => ({
  category: one(mcpCategory, {
    fields: [mcpServer.categoryId],
    references: [mcpCategory.id],
  }),
  user: one(user, {
    fields: [mcpServer.userId],
    references: [user.id],
  }),
  tools: many(mcpServerTool),
}));

export const mcpServerToolRelations = relations(mcpServerTool, ({ one }) => ({
  server: one(mcpServer, {
    fields: [mcpServerTool.mcpServerId],
    references: [mcpServer.id],
  }),
}));

export const team = mysqlTable("team", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  code: varchar("code", { length: 6 }).notNull().unique(),
  managerId: varchar("manager_id", { length: 36 })
    .notNull()
    .references(() => user.id),
  cursorApiKey: text("cursor_api_key"),
  geminiApiKey: text("gemini_api_key"),
  createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { fsp: 3 })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const userSettings = mysqlTable("user_settings", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  cursorApiKey: text("cursor_api_key"),
  geminiApiKey: text("gemini_api_key"),
  createdAt: timestamp("created_at", { fsp: 3 }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { fsp: 3 })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const userTeam = mysqlTable("user_team", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  teamId: varchar("team_id", { length: 36 })
    .notNull()
    .references(() => team.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at", { fsp: 3 }).defaultNow().notNull(),
  leftAt: timestamp("left_at", { fsp: 3 }),
});

export const teamRelations = relations(team, ({ one, many }) => ({
  manager: one(user, {
    fields: [team.managerId],
    references: [user.id],
  }),
  members: many(userTeam),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(user, {
    fields: [userSettings.userId],
    references: [user.id],
  }),
}));

export const userTeamRelations = relations(userTeam, ({ one }) => ({
  user: one(user, {
    fields: [userTeam.userId],
    references: [user.id],
  }),
  team: one(team, {
    fields: [userTeam.teamId],
    references: [team.id],
  }),
}));
