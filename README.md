# Chic Planet Store Manager — MCP Connector

A secure, **MCP (Model Context Protocol) server** that you attach to a ChatGPT
agent as a custom connector. It turns ChatGPT into a safe operations assistant
for the **Chic Planet by Kat Wells** Teemill store — drafting product copy,
design ideas, campaigns, promotions, website updates and social content, all
behind a **human approval gate**.

> **Brand:** Chic Planet by Kat Wells · chicplanetbykatwells.store · Teemill
> **Message:** _Wear Something That Says Something_

---

## What this is (and isn't)

- **It is** a remote MCP server (Streamable HTTP) exposing safe store-management
  tools, backed by a Neon Postgres database for drafts, campaigns, approvals and
  audit logs.
- **It is not** a tool that silently changes your live store. The agent can only
  create drafts and **queue** changes for you to approve and apply.

### Teemill API reality check

This was verified against Teemill's official docs (`teemill.com/api`,
`teemill.com/api-docs`) before building:

| Capability | Official API? | How this app handles it |
| --- | --- | --- |
| Create product from an image | ✅ Yes | Connector scaffolded (off until keys set) |
| Orders (create/manage) | ✅ Yes | Read-only status; never auto-charges |
| List / sync products | ✅ Yes | `teemill_list_products` (read-only) |
| Edit existing product copy / SEO | ❌ No public writable API | Draft + manual apply steps |
| Collections, homepage hero, banners, theme | ❌ No public writable API | Draft + manual apply steps |
| Webhooks for store content | ❌ Not documented | Paste-in workflow (promos) |

Because there is **no public writable API** for store content, those changes use
a safe **draft-and-apply** workflow: the agent writes the content and produces
numbered manual steps you follow in your Teemill admin.

---

## Tech stack

- **Next.js 16** (App Router) — hosts the MCP endpoint and a status page
- **MCP** via [`mcp-handler`](https://www.npmjs.com/package/mcp-handler) +
  `@modelcontextprotocol/sdk`
- **Neon Postgres** + **Drizzle ORM** for persistence
- **Tailwind CSS** + shadcn/ui for the status/setup page
- Bearer-token auth for the connector

---

## Setup

### 1. Environment variables

Copy `.env.example` and fill in values (see that file for details):

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Neon Postgres (auto-set by the Neon integration) |
| `MCP_API_TOKEN` | ✅ | Bearer token for the ChatGPT connector |
| `TEEMILL_ACCOUNT_ID` | optional | Teemill API identifier |
| `TEEMILL_PUBLIC_KEY` | optional | Teemill Public Safe Key |
| `TEEMILL_PRIVATE_KEY` | optional | Teemill Private Secure Key (orders/list) |

Generate a token: `openssl rand -base64 48`

### 2. Database

The schema lives in `lib/db/schema.ts`. Tables are already created in the
connected Neon database. The full DDL is in `db/schema.sql` for reference or to
recreate elsewhere. Seed/test data for Chic Planet is in `db/seed.sql`.

### 3. Run locally

```bash
pnpm install
pnpm dev
```

Open the status page at `http://localhost:3000` to see connection status, your
connector URL, and the full tool list.

### 4. Deploy

Deploy to Vercel (Publish button in v0, or `vercel`). Set the same environment
variables in **Project Settings → Environment Variables**.

---

## Connecting to ChatGPT

1. Your MCP server URL is: `https://<your-deployment>/api/mcp`
2. In ChatGPT: **Settings → Connectors → Create** (or add a custom connector to
   a Project/Agent).
3. Paste the URL, set auth to **Bearer / access token**, and paste your
   `MCP_API_TOKEN`.
4. Confirm by asking the agent to _"call get_brand_profile, then
   get_store_status"_.

---

## Tools

Grouped overview (see `lib/tool-catalog.ts`):

- **Context & status:** `get_brand_profile`, `get_store_status`
- **Teemill (read-only):** `teemill_status`, `teemill_list_products`
- **Products:** `list_products`, `import_product`, `save_product_suggestions`
- **Design ideas:** `save_design_idea`, `list_design_ideas`
- **Campaigns & promos:** `save_campaign`, `list_campaigns`, `save_promo_offer`,
  `list_promo_offers`
- **Website updates:** `save_website_draft`, `list_website_drafts`
- **Social content:** `save_social_post`, `list_social_posts`
- **Approvals & audit:** `queue_approval`, `list_approvals`, `decide_approval`,
  `get_audit_log`

---

## Approval workflow

Four levels enforced throughout (`lib/brand.ts → RISK_LEVELS`):

1. **Draft only** — safe, no store changes. All `save_*` tools are drafts.
2. **Prepare changes** — generates copy + manual update instructions.
3. **Write action** — applied only after you approve (`decide_approval`).
4. **Dangerous action** — deleting/disabling products, price changes or major
   homepage publishes. `decide_approval` refuses these unless you pass
   `confirm=true`.

Every action is recorded in the **audit log**, and write/dangerous approvals
carry a **rollback note**.

---

## Example agent prompts

See `docs/EXAMPLE_PROMPTS.md` for a ready-to-use set, e.g.:

- _"Pull my live Teemill products and import the top 5 into the manager."_
- _"Suggest improved names, descriptions and SEO for the Empowerment Edit tees,
  save them as drafts, then queue them for approval with manual steps."_
- _"I'll paste a Teemill promo email — extract the offer and build a banner, an
  Instagram caption and a 3-step promo plan."_
- _"Generate 5 disability-positive tote designs with Canva prompts and matching
  captions."_
- _"Draft the June homepage hero, an announcement bar, and a monthly update
  checklist."_

---

## Security

See `docs/SECURITY.md`. In short: credentials live only in environment
variables, the connector requires a bearer token, the agent cannot write to the
live store, dangerous actions need explicit confirmation, and everything is
audit-logged.
