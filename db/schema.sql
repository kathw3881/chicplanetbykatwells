-- Chic Planet Store Manager — database schema (PostgreSQL / Neon)
-- The four Better Auth tables are included for completeness; the MCP-only build
-- uses bearer-token auth, but these support a future logged-in dashboard.

-- ---------------------------------------------------------------------------
-- Better Auth tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "user" (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  "emailVerified" boolean NOT NULL DEFAULT false,
  image text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "session" (
  id text PRIMARY KEY,
  "expiresAt" timestamp NOT NULL,
  token text NOT NULL UNIQUE,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  "ipAddress" text,
  "userAgent" text,
  "userId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "account" (
  id text PRIMARY KEY,
  "accountId" text NOT NULL,
  "providerId" text NOT NULL,
  "userId" text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamp,
  "refreshTokenExpiresAt" timestamp,
  scope text,
  password text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "verification" (
  id text PRIMARY KEY,
  identifier text NOT NULL,
  value text NOT NULL,
  "expiresAt" timestamp NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- App tables (each carries a plain "userId" owner key for scoping)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_roles (
  id serial PRIMARY KEY,
  "userId" text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'owner', -- owner | editor | viewer
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS brand_settings (
  id serial PRIMARY KEY,
  "userId" text NOT NULL UNIQUE,
  "brandName" text NOT NULL DEFAULT 'Chic Planet by Kat Wells',
  website text NOT NULL DEFAULT 'chicplanetbykatwells.store',
  platform text NOT NULL DEFAULT 'Teemill',
  tone text NOT NULL DEFAULT 'British English, empowering, practical, colourful, friendly',
  slogan text NOT NULL DEFAULT 'Wear Something That Says Something',
  colours text NOT NULL DEFAULT 'hot pink, purple, coral, cream, black, sky blue',
  collections text NOT NULL DEFAULT 'Empowerment Edit, Giftable Totes, Summer Picks, Birthday Gifts, Inclusive Designs, Festival Picks, Eco Edit',
  "teemillApiEnabled" boolean NOT NULL DEFAULT false,
  "teemillConnected" boolean NOT NULL DEFAULT false,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id serial PRIMARY KEY,
  "userId" text NOT NULL,
  name text NOT NULL,
  description text,
  category text,
  "productType" text,
  visibility text NOT NULL DEFAULT 'visible',
  collection text,
  "seasonalStatus" text,
  "externalUrl" text,
  "teemillId" text,
  "suggestedName" text,
  "suggestedDescription" text,
  "seoCopy" text,
  "suggestedCollection" text,
  status text NOT NULL DEFAULT 'active',
  notes text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campaigns (
  id serial PRIMARY KEY,
  "userId" text NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'planned',
  season text,
  "startDate" date,
  "endDate" date,
  "featuredProducts" text,
  channels text,
  goals text,
  notes text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS promo_offers (
  id serial PRIMARY KEY,
  "userId" text NOT NULL,
  source text,
  "rawText" text,
  code text,
  "offerType" text,
  "minSpend" text,
  "startDate" date,
  "endDate" date,
  terms text,
  "bannerCopy" text,
  "socialCaption" text,
  "promoPlan" text,
  status text NOT NULL DEFAULT 'new',
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS design_ideas (
  id serial PRIMARY KEY,
  "userId" text NOT NULL,
  "productType" text NOT NULL,
  slogan text,
  "visualStyle" text,
  "colourPalette" text,
  "canvaPrompt" text,
  "productionNotes" text,
  "targetAudience" text,
  "socialCaption" text,
  theme text,
  status text NOT NULL DEFAULT 'idea',
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS website_drafts (
  id serial PRIMARY KEY,
  "userId" text NOT NULL,
  type text NOT NULL, -- hero | announcement | collection | feature-list | checklist
  title text,
  content text,
  "featuredProducts" text,
  "demoteProducts" text,
  checklist text,
  month text,
  status text NOT NULL DEFAULT 'draft',
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS social_posts (
  id serial PRIMARY KEY,
  "userId" text NOT NULL,
  platform text NOT NULL, -- tiktok | instagram | whatsapp | youtube
  "postType" text,
  caption text,
  "videoScript" text,
  "canvaPrompt" text,
  hashtags text,
  "relatedProduct" text,
  status text NOT NULL DEFAULT 'draft',
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS approvals (
  id serial PRIMARY KEY,
  "userId" text NOT NULL,
  "entityType" text NOT NULL,
  "entityId" integer,
  action text NOT NULL,
  "riskLevel" text NOT NULL DEFAULT 'draft', -- draft | prepare | write | dangerous
  summary text,
  "proposedChange" text,
  "rollbackNote" text,
  "manualSteps" text,
  status text NOT NULL DEFAULT 'pending', -- pending | approved | rejected | applied
  "decidedBy" text,
  "decidedAt" timestamp,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id serial PRIMARY KEY,
  "userId" text NOT NULL,
  "actorName" text,
  "actorEmail" text,
  "entityType" text,
  "entityId" integer,
  action text NOT NULL,
  "riskLevel" text NOT NULL DEFAULT 'draft',
  detail text,
  "rollbackNote" text,
  "createdAt" timestamp NOT NULL DEFAULT now()
);
