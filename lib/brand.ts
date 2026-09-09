/**
 * Default brand profile for Chic Planet by Kat Wells. These are seeded into the
 * brand_settings table per user and can be edited from the Settings page.
 */
export const DEFAULT_BRAND = {
  brandName: "Chic Planet by Kat Wells",
  website: "chicplanetbykatwells.store",
  platform: "Teemill",
  tone: "British English, empowering, practical, colourful, friendly",
  slogan: "Wear Something That Says Something",
  colours: "hot pink, purple, coral, cream, black, sky blue",
  collections:
    "Empowerment Edit, Giftable Totes, Summer Picks, Birthday Gifts, Inclusive Designs, Festival Picks, Eco Edit",
}

export const CORE_COLLECTIONS = [
  "Empowerment Edit",
  "Giftable Totes",
  "Summer Picks",
  "Birthday Gifts",
  "Inclusive Designs",
  "Festival Picks",
  "Eco Edit",
]

export const PRODUCT_TYPES = [
  "T-shirt",
  "Tote bag",
  "Hoodie",
  "Mug",
  "Mobile case",
  "Seasonal product",
  "Event-themed product",
  "Festival product",
  "Empowerment product",
  "Disability-positive product",
  "Eco-conscious product",
]

export const SOCIAL_PLATFORMS = [
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "whatsapp", label: "WhatsApp Channel" },
  { value: "youtube", label: "YouTube Community" },
] as const

/** The four approval / risk levels used across the whole app. */
export const RISK_LEVELS = {
  draft: {
    label: "Draft only",
    description: "Safe. No store changes.",
    tone: "neutral",
  },
  prepare: {
    label: "Prepare changes",
    description: "Generates copy and manual update instructions.",
    tone: "info",
  },
  write: {
    label: "Write action",
    description: "Applies a change after your approval.",
    tone: "warn",
  },
  dangerous: {
    label: "Dangerous action",
    description:
      "Deleting products, changing prices, disabling products or publishing major homepage changes. Always needs explicit confirmation.",
    tone: "danger",
  },
} as const

export type RiskLevel = keyof typeof RISK_LEVELS

export const SEASONAL_OPPORTUNITIES = [
  { month: "January", themes: ["New Year goals", "Veganuary", "Winter sales"] },
  { month: "February", themes: ["Valentine's", "LGBT+ History Month"] },
  { month: "March", themes: ["International Women's Day", "Mother's Day (UK)", "Spring refresh"] },
  { month: "April", themes: ["Earth Day", "Stress Awareness Month", "Easter"] },
  { month: "May", themes: ["Mental Health Awareness Week", "Festival season prep"] },
  { month: "June", themes: ["Pride Month", "Summer launch", "Father's Day"] },
  { month: "July", themes: ["Disability Pride Month", "Festival season", "Summer holidays"] },
  { month: "August", themes: ["Bank holiday", "Back to school prep", "Late summer"] },
  { month: "September", themes: ["Back to school", "Autumn refresh", "World Gratitude Day"] },
  { month: "October", themes: ["Black History Month (UK)", "Halloween", "World Mental Health Day"] },
  { month: "November", themes: ["Black Friday", "Cyber Monday", "Christmas gift prep", "Movember"] },
  { month: "December", themes: ["Christmas", "Last posting dates", "New Year teaser"] },
]
