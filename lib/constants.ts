/**
 * In MCP-server-only mode there is no interactive login. All data is owned by a
 * single store owner identity. The bearer token (MCP_API_TOKEN) is what actually
 * gates access to the server; this id is simply the row-scoping key used in every
 * query, exactly like the `getUserId()` pattern in the multi-user stack.
 */
export const OWNER_ID = "chic-planet-owner"
export const OWNER_NAME = "Kat Wells"
export const OWNER_EMAIL = "owner@chicplanetbykatwells.store"
