/** Human-readable catalogue of the MCP tools, grouped for the status page & docs. */
export const TOOL_CATALOG = [
  {
    group: "Context & status",
    tools: [
      { name: "get_brand_profile", desc: "Brand voice, palette, collections & risk levels." },
      { name: "get_store_status", desc: "Dashboard snapshot, seasonal opportunities, recommendations." },
    ],
  },
  {
    group: "Teemill (official, read-only)",
    tools: [
      { name: "teemill_status", desc: "What the official Teemill API can safely do." },
      { name: "teemill_list_products", desc: "List live products (read-only, needs private key)." },
    ],
  },
  {
    group: "Product manager",
    tools: [
      { name: "list_products", desc: "List products in the local manager." },
      { name: "import_product", desc: "Save a product into the manager (draft-safe)." },
      { name: "save_product_suggestions", desc: "Attach improved name/description/SEO as drafts." },
    ],
  },
  {
    group: "Design ideas",
    tools: [
      { name: "save_design_idea", desc: "Save a production-ready design idea + Canva prompt." },
      { name: "list_design_ideas", desc: "Browse saved design ideas." },
    ],
  },
  {
    group: "Campaigns & promotions",
    tools: [
      { name: "save_campaign", desc: "Save a seasonal or marketing campaign." },
      { name: "list_campaigns", desc: "List campaigns and seasonal plans." },
      { name: "save_promo_offer", desc: "Extract a pasted Teemill offer + build banner/caption/plan." },
      { name: "list_promo_offers", desc: "List saved promo offers." },
    ],
  },
  {
    group: "Website updates",
    tools: [
      { name: "save_website_draft", desc: "Hero copy, announcement bars, collection copy, checklists." },
      { name: "list_website_drafts", desc: "List website update drafts." },
    ],
  },
  {
    group: "Social content",
    tools: [
      { name: "save_social_post", desc: "TikTok/Instagram/WhatsApp/YouTube posts & video scripts." },
      { name: "list_social_posts", desc: "List saved social content." },
    ],
  },
  {
    group: "Approvals & audit (safety gate)",
    tools: [
      { name: "queue_approval", desc: "Queue a live-store change for owner approval + manual steps." },
      { name: "list_approvals", desc: "List approval requests by status." },
      { name: "decide_approval", desc: "Approve/reject/apply; dangerous items need confirm=true." },
      { name: "get_audit_log", desc: "Append-only history of every action." },
    ],
  },
] as const
