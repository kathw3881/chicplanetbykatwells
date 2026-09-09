import type { McpServer, ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { db } from "@/lib/db"
import {
  campaigns,
  designIdeas,
  products,
  promoOffers,
  socialPosts,
  websiteDrafts,
} from "@/lib/db/schema"
import { OWNER_ID } from "@/lib/constants"
import {
  CORE_COLLECTIONS,
  PRODUCT_TYPES,
  RISK_LEVELS,
  SEASONAL_OPPORTUNITIES,
  SOCIAL_PLATFORMS,
} from "@/lib/brand"
import {
  decideApproval,
  getBrand,
  listApprovals,
  listAudit,
  queueApproval,
  writeAudit,
} from "@/lib/store"
import { getTeemillStatus, teemillListProducts, teemillPing } from "@/lib/teemill"
import { and, desc, eq } from "drizzle-orm"

/* -------------------------------------------------------------------------- */
/* Response helpers                                                            */
/* -------------------------------------------------------------------------- */

function text(value: unknown) {
  const body =
    typeof value === "string" ? value : JSON.stringify(value, null, 2)
  return { content: [{ type: "text" as const, text: body }] }
}

const RISK_ENUM = z.enum(["draft", "prepare", "write", "dangerous"])

/* -------------------------------------------------------------------------- */
/* Tool registration                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Tools that only read/compute and never change state.
 * Everything else is a write to the LOCAL store-manager database only —
 * no tool deletes data or writes to arbitrary external resources, so all
 * writes use openWorldHint:false and destructiveHint:false. This satisfies
 * the OpenAI Apps SDK requirement that every tool declare annotations.
 */
const READ_ONLY_TOOLS = new Set([
  "get_brand_profile",
  "get_store_status",
  "teemill_status",
  "teemill_list_products",
  "list_products",
  "list_design_ideas",
  "list_campaigns",
  "list_promo_offers",
  "list_website_drafts",
  "list_social_posts",
  "list_approvals",
  "get_audit_log",
])

export function registerStoreTools(server: McpServer) {
  /**
   * Wrapper around server.tool that always attaches Apps SDK tool annotations.
   * read-only tools => readOnlyHint:true; all writes are bounded (openWorldHint:false)
   * and non-destructive (destructiveHint:false).
   */
  const tool = <Args extends z.ZodRawShape>(
    name: string,
    description: string,
    schema: Args,
    handler: ToolCallback<Args>,
  ) => {
    const readOnlyHint = READ_ONLY_TOOLS.has(name)
    return server.tool(
      name,
      description,
      schema,
      { title: name, readOnlyHint, openWorldHint: false, destructiveHint: false },
      handler,
    )
  }

  /* ---------------------------------------------------------------------- */
  /* Context & status                                                        */
  /* ---------------------------------------------------------------------- */

  tool(
    "get_brand_profile",
    "Return the Chic Planet by Kat Wells brand profile: name, website, tone of voice, slogan, colour palette, core collections, product types, and the four approval/risk levels. Call this FIRST before drafting any copy so everything stays on-brand and in British English.",
    {},
    async () => {
      const brand = await getBrand()
      return text({
        brand,
        coreCollections: CORE_COLLECTIONS,
        productTypes: PRODUCT_TYPES,
        socialPlatforms: SOCIAL_PLATFORMS,
        riskLevels: RISK_LEVELS,
        writingRules: [
          "Always write in British English (colour, organise, personalise).",
          "Tone: bold, colourful, empowering, inclusive, sustainable, accessible, meaningful, social-media friendly.",
          "Lead with the message 'Wear Something That Says Something' where it fits.",
          "Never invent discount codes or claims — only use offers the user provides.",
        ],
      })
    },
  )

  tool(
    "get_store_status",
    "Return a dashboard snapshot: counts of products/campaigns/designs/drafts/social posts, number of pending approvals, current and upcoming seasonal opportunities, recommended products to promote, and the Teemill API connection status.",
    {},
    async () => {
      const [prod, camp, designs, drafts, social, pending] = await Promise.all([
        db.select().from(products).where(eq(products.userId, OWNER_ID)),
        db.select().from(campaigns).where(eq(campaigns.userId, OWNER_ID)),
        db.select().from(designIdeas).where(eq(designIdeas.userId, OWNER_ID)),
        db.select().from(websiteDrafts).where(eq(websiteDrafts.userId, OWNER_ID)),
        db.select().from(socialPosts).where(eq(socialPosts.userId, OWNER_ID)),
        listApprovals("pending"),
      ])

      const monthIdx = new Date().getMonth()
      const thisMonth = SEASONAL_OPPORTUNITIES[monthIdx]
      const nextMonth = SEASONAL_OPPORTUNITIES[(monthIdx + 1) % 12]

      const recommended = prod
        .filter((p) => p.status === "active" && p.visibility === "visible")
        .slice(0, 5)
        .map((p) => ({ id: p.id, name: p.name, collection: p.collection }))

      return text({
        counts: {
          products: prod.length,
          campaigns: camp.length,
          designIdeas: designs.length,
          websiteDrafts: drafts.length,
          socialPosts: social.length,
          pendingApprovals: pending.length,
        },
        seasonal: { thisMonth, nextMonth },
        recommendedToPromote: recommended,
        activeCampaigns: camp
          .filter((c) => c.status === "active")
          .map((c) => ({ id: c.id, title: c.title, season: c.season })),
        teemill: getTeemillStatus(),
        pendingApprovals: pending.map((a) => ({
          id: a.id,
          action: a.action,
          riskLevel: a.riskLevel,
          summary: a.summary,
        })),
      })
    },
  )

  /* ---------------------------------------------------------------------- */
  /* Teemill (official, read-only / supported endpoints only)                */
  /* ---------------------------------------------------------------------- */

  tool(
    "teemill_status",
    "Check whether the official Teemill API is configured and what it can safely do. Teemill has NO public writable API for product copy, collections or homepage content, so those changes always use the draft + manual-apply workflow. This reports which read-only/supported capabilities are available.",
    {},
    async () => {
      const status = getTeemillStatus()
      const ping = status.configured ? await teemillPing() : null
      return text({
        status,
        connectivity: ping,
        note: "Editing existing product names/descriptions, collections, homepage hero, banners and theme is NOT available via Teemill's public API. Use draft tools + queue_approval to produce manual apply steps for those.",
      })
    },
  )

  tool(
    "teemill_list_products",
    "List products directly from the live Teemill account (read-only). Requires the Teemill Private Secure Key to be configured. This never modifies the store. Use import_product to save any of these into the local manager.",
    {},
    async () => {
      const res = await teemillListProducts()
      return text(res)
    },
  )

  /* ---------------------------------------------------------------------- */
  /* Products                                                                */
  /* ---------------------------------------------------------------------- */

  tool(
    "list_products",
    "List products stored in the local store manager (the working copy, not the live Teemill store). Optionally filter by collection or status.",
    {
      collection: z.string().optional().describe("Filter by collection name."),
      status: z.string().optional().describe("Filter by status, e.g. active."),
    },
    async ({ collection, status }) => {
      const rows = await db
        .select()
        .from(products)
        .where(eq(products.userId, OWNER_ID))
        .orderBy(desc(products.updatedAt))
      const filtered = rows.filter(
        (p) =>
          (!collection || p.collection === collection) &&
          (!status || p.status === status),
      )
      return text(filtered)
    },
  )

  tool(
    "import_product",
    "Save/import a product into the local store manager (draft-safe; does not change the live store). Use for products pulled from teemill_list_products or entered manually.",
    {
      name: z.string().describe("Current product name."),
      description: z.string().optional(),
      category: z.string().optional(),
      productType: z.string().optional().describe("e.g. T-shirt, Tote bag, Mug."),
      collection: z.string().optional(),
      visibility: z.enum(["visible", "hidden"]).optional(),
      seasonalStatus: z.string().optional(),
      externalUrl: z.string().optional(),
      teemillId: z.string().optional(),
    },
    async (args) => {
      const inserted = await db
        .insert(products)
        .values({ userId: OWNER_ID, ...args })
        .returning()
      await writeAudit({
        entityType: "product",
        entityId: inserted[0].id,
        action: "import_product",
        riskLevel: "draft",
        detail: `Imported product "${args.name}".`,
      })
      return text({ saved: inserted[0] })
    },
  )

  tool(
    "save_product_suggestions",
    "Attach AI-improved copy to a product as DRAFTS only (improved name, description, SEO copy, suggested collection). This does NOT publish anything to Teemill — it stores suggestions for review. Use queue_approval afterwards to create manual apply steps.",
    {
      productId: z.number().describe("Local product id."),
      suggestedName: z.string().optional(),
      suggestedDescription: z.string().optional(),
      seoCopy: z.string().optional(),
      suggestedCollection: z.string().optional(),
      notes: z.string().optional(),
    },
    async ({ productId, ...fields }) => {
      const updated = await db
        .update(products)
        .set({ ...fields, updatedAt: new Date() })
        .where(and(eq(products.id, productId), eq(products.userId, OWNER_ID)))
        .returning()
      if (updated.length === 0)
        return text({ error: `No product with id ${productId}.` })
      await writeAudit({
        entityType: "product",
        entityId: productId,
        action: "save_product_suggestions",
        riskLevel: "draft",
        detail: "Stored improved copy suggestions (draft).",
      })
      return text({ updated: updated[0] })
    },
  )

  /* ---------------------------------------------------------------------- */
  /* Design ideas                                                            */
  /* ---------------------------------------------------------------------- */

  tool(
    "save_design_idea",
    "Save a new product design idea. Include every field so it is production-ready: product type, slogan, visual style, colour palette, a Canva prompt, Teemill-safe production notes, target audience and a matching social caption.",
    {
      productType: z.string().describe("e.g. Tote bag, T-shirt, Hoodie, Mug, Mobile case."),
      slogan: z.string().optional(),
      visualStyle: z.string().optional(),
      colourPalette: z.string().optional(),
      canvaPrompt: z.string().optional(),
      productionNotes: z.string().optional().describe("Teemill-safe print notes."),
      targetAudience: z.string().optional(),
      socialCaption: z.string().optional(),
      theme: z.string().optional().describe("e.g. festival, empowerment, eco, seasonal."),
    },
    async (args) => {
      const inserted = await db
        .insert(designIdeas)
        .values({ userId: OWNER_ID, ...args })
        .returning()
      await writeAudit({
        entityType: "design_idea",
        entityId: inserted[0].id,
        action: "save_design_idea",
        riskLevel: "draft",
        detail: `Saved design idea for ${args.productType}.`,
      })
      return text({ saved: inserted[0] })
    },
  )

  tool(
    "list_design_ideas",
    "List saved design ideas, optionally filtered by product type or theme.",
    {
      productType: z.string().optional(),
      theme: z.string().optional(),
    },
    async ({ productType, theme }) => {
      const rows = await db
        .select()
        .from(designIdeas)
        .where(eq(designIdeas.userId, OWNER_ID))
        .orderBy(desc(designIdeas.createdAt))
      return text(
        rows.filter(
          (d) =>
            (!productType || d.productType === productType) &&
            (!theme || d.theme === theme),
        ),
      )
    },
  )

  /* ---------------------------------------------------------------------- */
  /* Campaigns                                                               */
  /* ---------------------------------------------------------------------- */

  tool(
    "save_campaign",
    "Save a marketing campaign or seasonal plan (e.g. Pride, Black Friday, Summer Picks launch).",
    {
      title: z.string(),
      description: z.string().optional(),
      season: z.string().optional(),
      status: z.enum(["planned", "active", "done"]).optional(),
      startDate: z.string().optional().describe("ISO date YYYY-MM-DD."),
      endDate: z.string().optional().describe("ISO date YYYY-MM-DD."),
      featuredProducts: z.string().optional(),
      channels: z.string().optional().describe("e.g. TikTok, Instagram, WhatsApp."),
      goals: z.string().optional(),
    },
    async (args) => {
      const inserted = await db
        .insert(campaigns)
        .values({ userId: OWNER_ID, ...args })
        .returning()
      await writeAudit({
        entityType: "campaign",
        entityId: inserted[0].id,
        action: "save_campaign",
        riskLevel: "draft",
        detail: `Saved campaign "${args.title}".`,
      })
      return text({ saved: inserted[0] })
    },
  )

  tool(
    "list_campaigns",
    "List saved campaigns and seasonal plans.",
    {},
    async () => {
      const rows = await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.userId, OWNER_ID))
        .orderBy(desc(campaigns.createdAt))
      return text(rows)
    },
  )

  /* ---------------------------------------------------------------------- */
  /* Promo offers (promotion watcher)                                        */
  /* ---------------------------------------------------------------------- */

  tool(
    "save_promo_offer",
    "Save a Teemill promotion the user has pasted (from a promo email or screenshot text). Extract and store the offer details, then generate a banner, a social caption and a short promo plan. Only use offer details the user actually provided — never invent codes, dates or terms.",
    {
      source: z.string().optional().describe("Where it came from, e.g. Teemill email."),
      rawText: z.string().optional().describe("The pasted promo text for the record."),
      code: z.string().optional(),
      offerType: z.string().optional().describe("e.g. free shipping, percentage off."),
      minSpend: z.string().optional(),
      startDate: z.string().optional().describe("ISO date YYYY-MM-DD."),
      endDate: z.string().optional().describe("ISO date YYYY-MM-DD."),
      terms: z.string().optional(),
      bannerCopy: z.string().optional(),
      socialCaption: z.string().optional(),
      promoPlan: z.string().optional(),
    },
    async (args) => {
      const inserted = await db
        .insert(promoOffers)
        .values({ userId: OWNER_ID, ...args })
        .returning()
      await writeAudit({
        entityType: "promo_offer",
        entityId: inserted[0].id,
        action: "save_promo_offer",
        riskLevel: "draft",
        detail: `Saved promo offer${args.code ? ` (${args.code})` : ""}.`,
      })
      return text({ saved: inserted[0] })
    },
  )

  tool(
    "list_promo_offers",
    "List saved promo offers and their generated banners/captions/plans.",
    {},
    async () => {
      const rows = await db
        .select()
        .from(promoOffers)
        .where(eq(promoOffers.userId, OWNER_ID))
        .orderBy(desc(promoOffers.createdAt))
      return text(rows)
    },
  )

  /* ---------------------------------------------------------------------- */
  /* Website update drafts                                                   */
  /* ---------------------------------------------------------------------- */

  tool(
    "save_website_draft",
    "Save a website update draft: homepage hero copy, an announcement bar, collection section copy, a feature/demote product list, or a monthly homepage update checklist. These are drafts for manual application in Teemill — they are never auto-published.",
    {
      type: z
        .enum(["hero", "announcement", "collection", "feature-list", "checklist"])
        .describe("The kind of website update."),
      title: z.string().optional(),
      content: z.string().optional(),
      featuredProducts: z.string().optional(),
      demoteProducts: z.string().optional().describe("Products to demote seasonally."),
      checklist: z.string().optional(),
      month: z.string().optional(),
    },
    async (args) => {
      const inserted = await db
        .insert(websiteDrafts)
        .values({ userId: OWNER_ID, ...args })
        .returning()
      await writeAudit({
        entityType: "website_draft",
        entityId: inserted[0].id,
        action: "save_website_draft",
        riskLevel: "draft",
        detail: `Saved ${args.type} website draft.`,
      })
      return text({ saved: inserted[0] })
    },
  )

  tool(
    "list_website_drafts",
    "List saved website update drafts.",
    { type: z.string().optional() },
    async ({ type }) => {
      const rows = await db
        .select()
        .from(websiteDrafts)
        .where(eq(websiteDrafts.userId, OWNER_ID))
        .orderBy(desc(websiteDrafts.createdAt))
      return text(rows.filter((d) => !type || d.type === type))
    },
  )

  /* ---------------------------------------------------------------------- */
  /* Social posts                                                            */
  /* ---------------------------------------------------------------------- */

  tool(
    "save_social_post",
    "Save a social content draft: TikTok/Instagram caption, WhatsApp Channel post, YouTube Community post, a short promo video script, or a Canva Pro prompt for a promo video. Keep it on-brand and in British English.",
    {
      platform: z
        .enum(["tiktok", "instagram", "whatsapp", "youtube"])
        .describe("Target platform."),
      postType: z
        .string()
        .optional()
        .describe("e.g. caption, video-script, canva-prompt, launch-post."),
      caption: z.string().optional(),
      videoScript: z.string().optional(),
      canvaPrompt: z.string().optional(),
      hashtags: z.string().optional(),
      relatedProduct: z.string().optional(),
    },
    async (args) => {
      const inserted = await db
        .insert(socialPosts)
        .values({ userId: OWNER_ID, ...args })
        .returning()
      await writeAudit({
        entityType: "social_post",
        entityId: inserted[0].id,
        action: "save_social_post",
        riskLevel: "draft",
        detail: `Saved ${args.platform} ${args.postType ?? "post"}.`,
      })
      return text({ saved: inserted[0] })
    },
  )

  tool(
    "list_social_posts",
    "List saved social content drafts, optionally filtered by platform.",
    { platform: z.string().optional() },
    async ({ platform }) => {
      const rows = await db
        .select()
        .from(socialPosts)
        .where(eq(socialPosts.userId, OWNER_ID))
        .orderBy(desc(socialPosts.createdAt))
      return text(rows.filter((p) => !platform || p.platform === platform))
    },
  )

  /* ---------------------------------------------------------------------- */
  /* Approvals — the safety gate                                             */
  /* ---------------------------------------------------------------------- */

  tool(
    "queue_approval",
    "Queue a change for the store owner to review and apply. Use this for ANYTHING that would alter the live Teemill store (publishing copy, changing a product, homepage updates). Provide clear manual steps the owner follows in Teemill, plus a rollback note. Set the correct riskLevel: 'write' for normal changes, 'dangerous' for deleting/disabling products, price changes or major homepage publishes.",
    {
      entityType: z.string().describe("e.g. product, website, campaign, promo."),
      entityId: z.number().optional(),
      action: z.string().describe("Short action name, e.g. publish_hero_copy."),
      riskLevel: RISK_ENUM,
      summary: z.string().describe("One-line summary of the change."),
      proposedChange: z.string().optional().describe("The exact new content."),
      manualSteps: z
        .string()
        .describe("Numbered steps the owner follows in Teemill to apply this."),
      rollbackNote: z
        .string()
        .optional()
        .describe("How to undo this if needed."),
    },
    async (args) => {
      const approval = await queueApproval(args)
      return text({
        queued: approval,
        message:
          "Change queued for approval. Nothing has been applied to the live store. The owner must approve it, then follow the manual steps in Teemill.",
      })
    },
  )

  tool(
    "list_approvals",
    "List approval requests. Optionally filter by status: pending, approved, rejected, applied.",
    {
      status: z
        .enum(["pending", "approved", "rejected", "applied"])
        .optional(),
    },
    async ({ status }) => {
      const rows = await listApprovals(status)
      return text(rows)
    },
  )

  tool(
    "decide_approval",
    "Record a decision on a queued approval. 'dangerous' risk items require confirm=true to be approved or applied — this enforces explicit confirmation for destructive actions. This only updates the approval record and audit log; it never itself writes to Teemill.",
    {
      id: z.number(),
      decision: z.enum(["approved", "rejected", "applied"]),
      confirm: z
        .boolean()
        .optional()
        .describe("Must be true to approve/apply a 'dangerous' item."),
    },
    async ({ id, decision, confirm }) => {
      const existing = await listApprovals()
      const target = existing.find((a) => a.id === id)
      if (!target) return text({ error: `No approval with id ${id}.` })

      if (
        target.riskLevel === "dangerous" &&
        decision !== "rejected" &&
        confirm !== true
      ) {
        return text({
          blocked: true,
          message:
            "This is a DANGEROUS action and requires explicit confirmation. Re-call with confirm=true to proceed, or set decision='rejected' to cancel.",
          approval: target,
        })
      }

      const updated = await decideApproval(id, decision)
      return text({ updated })
    },
  )

  /* ---------------------------------------------------------------------- */
  /* Audit log                                                               */
  /* ---------------------------------------------------------------------- */

  tool(
    "get_audit_log",
    "Return the audit log: an append-only history of every draft, suggestion, approval and decision, newest first. Use this to review what the agent has done.",
    { limit: z.number().optional().describe("Max entries (default 100).") },
    async ({ limit }) => {
      const rows = await listAudit(limit ?? 100)
      return text(rows)
    },
  )
}
