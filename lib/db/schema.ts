import {
  pgTable,
  text,
  timestamp,
  boolean,
  serial,
  integer,
  date,
} from "drizzle-orm/pg-core"

/* ---------------------------------------------------------------------------
 * Better Auth tables (column names are camelCase to match Better Auth defaults)
 * ------------------------------------------------------------------------- */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updatedAt")
    .$defaultFn(() => new Date())
    .notNull(),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").$defaultFn(() => new Date()),
  updatedAt: timestamp("updatedAt").$defaultFn(() => new Date()),
})

/* ---------------------------------------------------------------------------
 * App tables — every table carries a plain `userId` for per-user scoping.
 * No foreign keys on app tables (per Neon stack guidance).
 * ------------------------------------------------------------------------- */

export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull().unique(),
  role: text("role").notNull().default("owner"), // owner | editor | viewer
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const brandSettings = pgTable("brand_settings", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull().unique(),
  brandName: text("brandName").notNull().default("Chic Planet by Kat Wells"),
  website: text("website").notNull().default("chicplanetbykatwells.store"),
  platform: text("platform").notNull().default("Teemill"),
  tone: text("tone")
    .notNull()
    .default("British English, empowering, practical, colourful, friendly"),
  slogan: text("slogan").notNull().default("Wear Something That Says Something"),
  colours: text("colours")
    .notNull()
    .default("hot pink, purple, coral, cream, black, sky blue"),
  collections: text("collections")
    .notNull()
    .default(
      "Empowerment Edit, Giftable Totes, Summer Picks, Birthday Gifts, Inclusive Designs, Festival Picks, Eco Edit",
    ),
  teemillApiEnabled: boolean("teemillApiEnabled").notNull().default(false),
  teemillConnected: boolean("teemillConnected").notNull().default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  productType: text("productType"),
  visibility: text("visibility").notNull().default("visible"),
  collection: text("collection"),
  seasonalStatus: text("seasonalStatus"),
  externalUrl: text("externalUrl"),
  teemillId: text("teemillId"),
  suggestedName: text("suggestedName"),
  suggestedDescription: text("suggestedDescription"),
  seoCopy: text("seoCopy"),
  suggestedCollection: text("suggestedCollection"),
  status: text("status").notNull().default("active"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("planned"),
  season: text("season"),
  startDate: date("startDate"),
  endDate: date("endDate"),
  featuredProducts: text("featuredProducts"),
  channels: text("channels"),
  goals: text("goals"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const promoOffers = pgTable("promo_offers", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  source: text("source"),
  rawText: text("rawText"),
  code: text("code"),
  offerType: text("offerType"),
  minSpend: text("minSpend"),
  startDate: date("startDate"),
  endDate: date("endDate"),
  terms: text("terms"),
  bannerCopy: text("bannerCopy"),
  socialCaption: text("socialCaption"),
  promoPlan: text("promoPlan"),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const designIdeas = pgTable("design_ideas", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  productType: text("productType").notNull(),
  slogan: text("slogan"),
  visualStyle: text("visualStyle"),
  colourPalette: text("colourPalette"),
  canvaPrompt: text("canvaPrompt"),
  productionNotes: text("productionNotes"),
  targetAudience: text("targetAudience"),
  socialCaption: text("socialCaption"),
  theme: text("theme"),
  status: text("status").notNull().default("idea"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const websiteDrafts = pgTable("website_drafts", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  type: text("type").notNull(), // hero | announcement | collection | feature-list | checklist
  title: text("title"),
  content: text("content"),
  featuredProducts: text("featuredProducts"),
  demoteProducts: text("demoteProducts"),
  checklist: text("checklist"),
  month: text("month"),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const socialPosts = pgTable("social_posts", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  platform: text("platform").notNull(), // tiktok | instagram | whatsapp | youtube
  postType: text("postType"),
  caption: text("caption"),
  videoScript: text("videoScript"),
  canvaPrompt: text("canvaPrompt"),
  hashtags: text("hashtags"),
  relatedProduct: text("relatedProduct"),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const approvals = pgTable("approvals", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  entityType: text("entityType").notNull(),
  entityId: integer("entityId"),
  action: text("action").notNull(),
  riskLevel: text("riskLevel").notNull().default("draft"), // draft | prepare | write | dangerous
  summary: text("summary"),
  proposedChange: text("proposedChange"),
  rollbackNote: text("rollbackNote"),
  manualSteps: text("manualSteps"),
  status: text("status").notNull().default("pending"), // pending | approved | rejected | applied
  decidedBy: text("decidedBy"),
  decidedAt: timestamp("decidedAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: text("userId").notNull(),
  actorName: text("actorName"),
  actorEmail: text("actorEmail"),
  entityType: text("entityType"),
  entityId: integer("entityId"),
  action: text("action").notNull(),
  riskLevel: text("riskLevel").notNull().default("draft"),
  detail: text("detail"),
  rollbackNote: text("rollbackNote"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})
