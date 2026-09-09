/**
 * Teemill API client.
 *
 * IMPORTANT — what Teemill officially supports (verified from teemill.com/api
 * and teemill.com/api-docs):
 *   - Custom Product endpoint (send an image, get a buyable product URL)
 *   - Orders API (create / manage orders)
 *   - Get/Sync products
 *
 * What Teemill does NOT currently expose a public, writable API for:
 *   - Editing existing product names / descriptions / SEO
 *   - Collections, homepage hero copy, announcement bars, banners, theme
 *
 * Therefore this client only ever performs the SUPPORTED, mostly read-only
 * operations. Everything else stays in the safe "draft + manual apply" workflow.
 *
 * Credentials are read from environment variables only and are NEVER returned to
 * the MCP client or written to the database.
 */

const BASE_URL = "https://api.teemill.com/v1"

/** Support both current and legacy env var names for each key. */
function getPublicKey(): string | undefined {
  return process.env.TEEMILL_PUBLIC_KEY ?? process.env.TEEMILL_PUBLIC_SAFE_KEY
}

function getPrivateKey(): string | undefined {
  return process.env.TEEMILL_PRIVATE_KEY ?? process.env.TEEMILL_PRIVATE_API_KEY
}

export type TeemillStatus = {
  configured: boolean
  hasPublicKey: boolean
  hasPrivateKey: boolean
  accountId: string | null
  /** Capabilities that are safe to expose given the configured keys. */
  capabilities: {
    readPublicInfo: boolean
    listProducts: boolean
    createOrders: boolean
  }
}

export function getTeemillStatus(): TeemillStatus {
  const accountId = process.env.TEEMILL_ACCOUNT_ID ?? null
  const hasPublicKey = Boolean(getPublicKey())
  const hasPrivateKey = Boolean(getPrivateKey())
  return {
    configured: Boolean(accountId && (hasPublicKey || hasPrivateKey)),
    hasPublicKey,
    hasPrivateKey,
    accountId,
    capabilities: {
      readPublicInfo: hasPublicKey || hasPrivateKey,
      listProducts: hasPrivateKey,
      createOrders: hasPrivateKey,
    },
  }
}

type TeemillKeyType = "public" | "private"

async function teemillFetch(
  path: string,
  keyType: TeemillKeyType,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; data: unknown; error?: string }> {
  const key = keyType === "private" ? getPrivateKey() : getPublicKey()

  if (!key) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: `Teemill ${keyType} key is not configured. Set TEEMILL_${keyType.toUpperCase()}_KEY to enable this.`,
    }
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        Authorization: key,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
      // Never cache store data on the server.
      cache: "no-store",
    })

    const text = await res.text()
    let data: unknown = null
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      data = text
    }

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        data,
        error: `Teemill API responded ${res.status}.`,
      }
    }
    return { ok: true, status: res.status, data }
  } catch (err) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: err instanceof Error ? err.message : "Unknown network error.",
    }
  }
}

/**
 * Verify connectivity using the catalogue products endpoint (read-only).
 */
export async function teemillPing() {
  const status = getTeemillStatus()
  if (!status.configured) {
    return {
      connected: false,
      reason:
        "No Teemill credentials configured. Add TEEMILL_ACCOUNT_ID and at least TEEMILL_PUBLIC_KEY.",
    }
  }
  if (!status.accountId) {
    return {
      connected: false,
      reason: "TEEMILL_ACCOUNT_ID is required to reach the catalogue endpoint.",
    }
  }
  const res = await teemillFetch(
    `/catalog/products?project=${encodeURIComponent(status.accountId)}`,
    "private",
  )
  return {
    connected: res.ok,
    status: res.status,
    reason: res.ok ? undefined : res.error,
    data: res.ok ? res.data : undefined,
  }
}

/**
 * List products from the Teemill account. Requires the private key.
 * Read-only — does not modify anything.
 */
export async function teemillListProducts() {
  const status = getTeemillStatus()
  if (!status.capabilities.listProducts) {
    return {
      ok: false,
      error:
        "Listing products requires the Teemill Private Secure Key (TEEMILL_PRIVATE_KEY). This is read-only and never modifies your store.",
      products: [],
    }
  }
  if (!status.accountId) {
    return {
      ok: false,
      error: "TEEMILL_ACCOUNT_ID is required to list catalogue products.",
      products: [],
    }
  }

  const res = await teemillFetch(
    `/catalog/products?project=${encodeURIComponent(status.accountId)}`,
    "private",
  )

  if (!res.ok) {
    return {
      ok: false,
      error: res.error,
      products: [],
    }
  }

  const data = res.data as
    | {
        products?: unknown[]
        nextPageToken?: string | null
        data?: { products?: unknown[] } | unknown[]
      }
    | unknown[]
    | null

  const productList = Array.isArray(data)
    ? data
    : Array.isArray(data?.products)
      ? data.products
      : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.data?.products)
          ? data.data.products
          : []

  const nextPageToken =
    !Array.isArray(data) && typeof data?.nextPageToken === "string"
      ? data.nextPageToken
      : null

  return {
    ok: true,
    products: productList,
    nextPageToken,
  }
}
