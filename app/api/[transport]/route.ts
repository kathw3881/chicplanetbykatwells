import { createMcpHandler } from "mcp-handler"
import { registerStoreTools } from "@/lib/mcp-tools"

export const maxDuration = 60

const handler = createMcpHandler(
  (server) => {
    registerStoreTools(server)
  },
  {
    serverInfo: {
      name: "chic-planet-store-manager",
      version: "1.0.0",
    },
    instructions:
      "Store manager for the Chic Planet by Kat Wells Teemill store. ALWAYS call get_brand_profile first so copy stays on-brand and in British English. This server only DRAFTS changes — it never edits the live Teemill store. Teemill has no public writable API for product copy, collections or homepage content, so any live change must go through queue_approval, which produces manual steps the owner applies in Teemill. Dangerous actions (deleting/disabling products, price changes, major homepage publishes) require explicit confirmation via decide_approval with confirm=true.",
  },
  {
    basePath: "/api",
    verboseLogs: true,
    maxDuration: 60,
  },
)

/* -------------------------------------------------------------------------- */
/* Bearer-token auth                                                          */
/*                                                                            */
/* The ChatGPT connector sends `Authorization: Bearer <token>`. We compare it */
/* (in constant time) against MCP_API_TOKEN.                                  */
/*                                                                            */
/* We intentionally do NOT use mcp-handler's `withMcpAuth`, because it returns */
/* a `WWW-Authenticate` header advertising OAuth protected-resource metadata  */
/* (a /.well-known/... URL that does not exist here). ChatGPT follows that    */
/* hint, hits a 404, and the connector fails to add even when an API key is   */
/* supplied. Our 401 below uses a plain `Bearer` challenge with no OAuth       */
/* discovery hint, so ChatGPT's "Access token / API key" mode works cleanly.  */
/* -------------------------------------------------------------------------- */

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}

function unauthorized(message: string): Response {
  return new Response(
    JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32001, message },
      id: null,
    }),
    {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        // Plain Bearer challenge — no OAuth resource_metadata hint.
        "WWW-Authenticate": 'Bearer realm="chic-planet-store-manager"',
      },
    },
  )
}

function isAuthorized(req: Request): boolean {
  const expected = process.env.MCP_API_TOKEN
  if (!expected) {
    console.error(
      "[v0] MCP_API_TOKEN is not set — refusing all requests. Set it in project env vars.",
    )
    return false
  }

  const header = req.headers.get("authorization") ?? ""
  const [scheme, ...rest] = header.split(" ")
  const token = rest.join(" ").trim()

  if (scheme?.toLowerCase() !== "bearer" || !token) return false
  return timingSafeEqual(token, expected)
}

/**
 * Auth mode is controlled by MCP_AUTH_MODE:
 *   - unset / "token" (default) → bearer token required (secure).
 *   - "none"                    → no auth, server is open.
 *
 * "none" exists so the server can be added to ChatGPT using the "No Auth"
 * connector option, which avoids ChatGPT's auth-discovery probe entirely.
 * Only use it with an unguessable production URL, and switch back to token
 * auth once the connector is working.
 */
function isOpenMode(): boolean {
  return (process.env.MCP_AUTH_MODE ?? "token").toLowerCase() === "none"
}

async function authedHandler(req: Request): Promise<Response> {
  if (!isOpenMode() && !isAuthorized(req)) {
    return unauthorized("Missing or invalid bearer token.")
  }
  return handler(req)
}

export {
  authedHandler as GET,
  authedHandler as POST,
  authedHandler as DELETE,
}
