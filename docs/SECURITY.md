# Security Notes

This app is built to prioritise **safety, approval and clear drafts** over risky
automation. Here is how each requirement is met.

## Credentials & secrets

- **No passwords are stored in plain text.** The app does not store any user
  passwords at all in MCP-server mode; access is via a bearer token.
- **Credentials live only in environment variables** (`MCP_API_TOKEN`,
  `TEEMILL_*`, `DATABASE_URL`). They are read on the server and **never** sent to
  the MCP client, written into code, or persisted to the database.
- The status page shows only **whether** a secret is configured, never its value.
- **Token rotation:** change `MCP_API_TOKEN` in Project Settings → Vars at any
  time; update the value in your ChatGPT connector to match.

> ⚠️ If a Teemill **Private Secure Key** is ever exposed (for example in a
> screenshot), revoke + regenerate it in Teemill immediately, then update
> `TEEMILL_PRIVATE_KEY`.

## Authentication

- The MCP endpoint (`/api/mcp`) is wrapped with `withMcpAuth` and rejects any
  request without a valid `Authorization: Bearer <token>` header (HTTP 401).
- Token comparison uses a **constant-time** check to avoid timing attacks.
- If `MCP_API_TOKEN` is unset, the server refuses **all** requests (fails closed).

## Write protection & approval gate

- The agent can freely create **drafts** (`save_*` tools). Drafts never touch the
  live store.
- Any change to the live store must go through `queue_approval`, which stores a
  summary, the proposed content, **numbered manual steps**, and a **rollback
  note** — then waits for a human.
- `decide_approval` records approve/reject/apply decisions. **Dangerous** actions
  (deleting/disabling products, price changes, major homepage publishes) are
  **blocked unless `confirm=true`** is explicitly provided.
- The app performs **no destructive Teemill writes** itself. Even with the
  private key configured, only supported, mostly read-only endpoints are called
  (status, list products). It never deletes products or changes prices via API.

## Auditing & rollback

- Every meaningful action is appended to the **audit log** (`audit_logs`):
  drafts, suggestions, queued approvals and decisions, with actor, timestamp,
  entity, risk level and detail.
- Write/dangerous approvals include a **rollback note** describing how to undo
  the change in Teemill.

## Data scoping

- Every query is scoped by a `userId` owner key (the `getUserId()`-style pattern
  from the Neon stack). There is no cross-tenant data access.
- Parameterised queries via Drizzle ORM prevent SQL injection.

## Scraping & automation boundaries

- The app does **not** scrape private Teemill pages and does **not** bypass
  CAPTCHA or any security system.
- Promotions are handled by **pasting** the content you received (email/screenshot
  text) — no unauthorised access to your inbox or account.
- Optional browser automation, if ever added, is only for user-approved manual
  workflows — never for bypassing protections.

## Transport

- Streamable HTTP over HTTPS in production.
- No store data is cached on the server (`cache: "no-store"` on Teemill calls).
