import { db } from "@/lib/db"
import {
  approvals,
  auditLogs,
  brandSettings,
  campaigns,
  designIdeas,
  products,
  promoOffers,
  socialPosts,
  websiteDrafts,
} from "@/lib/db/schema"
import { DEFAULT_BRAND, type RiskLevel } from "@/lib/brand"
import { OWNER_EMAIL, OWNER_ID, OWNER_NAME } from "@/lib/constants"
import { and, desc, eq } from "drizzle-orm"

/* -------------------------------------------------------------------------- */
/* Brand settings                                                              */
/* -------------------------------------------------------------------------- */

export async function getBrand() {
  const rows = await db
    .select()
    .from(brandSettings)
    .where(eq(brandSettings.userId, OWNER_ID))
    .limit(1)

  if (rows.length > 0) return rows[0]

  const inserted = await db
    .insert(brandSettings)
    .values({ userId: OWNER_ID, ...DEFAULT_BRAND })
    .returning()
  return inserted[0]
}

/* -------------------------------------------------------------------------- */
/* Audit log — append-only record of everything that happens                   */
/* -------------------------------------------------------------------------- */

export async function writeAudit(entry: {
  entityType: string
  entityId?: number | null
  action: string
  riskLevel?: RiskLevel
  detail?: string
  rollbackNote?: string
}) {
  await db.insert(auditLogs).values({
    userId: OWNER_ID,
    actorName: OWNER_NAME,
    actorEmail: OWNER_EMAIL,
    entityType: entry.entityType,
    entityId: entry.entityId ?? null,
    action: entry.action,
    riskLevel: entry.riskLevel ?? "draft",
    detail: entry.detail,
    rollbackNote: entry.rollbackNote,
  })
}

export async function listAudit(limit = 100) {
  return db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.userId, OWNER_ID))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
}

/* -------------------------------------------------------------------------- */
/* Approvals — the safety gate for any write / dangerous action                */
/* -------------------------------------------------------------------------- */

export async function queueApproval(entry: {
  entityType: string
  entityId?: number | null
  action: string
  riskLevel: RiskLevel
  summary: string
  proposedChange?: string
  rollbackNote?: string
  manualSteps?: string
}) {
  const inserted = await db
    .insert(approvals)
    .values({
      userId: OWNER_ID,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      action: entry.action,
      riskLevel: entry.riskLevel,
      summary: entry.summary,
      proposedChange: entry.proposedChange,
      rollbackNote: entry.rollbackNote,
      manualSteps: entry.manualSteps,
      status: "pending",
    })
    .returning()

  await writeAudit({
    entityType: "approval",
    entityId: inserted[0].id,
    action: `queued:${entry.action}`,
    riskLevel: entry.riskLevel,
    detail: entry.summary,
    rollbackNote: entry.rollbackNote,
  })

  return inserted[0]
}

export async function listApprovals(status?: string) {
  const where = status
    ? and(eq(approvals.userId, OWNER_ID), eq(approvals.status, status))
    : eq(approvals.userId, OWNER_ID)
  return db
    .select()
    .from(approvals)
    .where(where)
    .orderBy(desc(approvals.createdAt))
}

export async function decideApproval(
  id: number,
  decision: "approved" | "rejected" | "applied",
) {
  const updated = await db
    .update(approvals)
    .set({
      status: decision,
      decidedBy: OWNER_NAME,
      decidedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(approvals.id, id), eq(approvals.userId, OWNER_ID)))
    .returning()

  if (updated.length === 0) return null

  await writeAudit({
    entityType: "approval",
    entityId: id,
    action: `decision:${decision}`,
    riskLevel: updated[0].riskLevel as RiskLevel,
    detail: updated[0].summary ?? undefined,
    rollbackNote: updated[0].rollbackNote ?? undefined,
  })

  return updated[0]
}

/* -------------------------------------------------------------------------- */
/* Generic owner-scoped helpers for the content tables                         */
/* -------------------------------------------------------------------------- */

export const tables = {
  products,
  campaigns,
  promoOffers,
  designIdeas,
  websiteDrafts,
  socialPosts,
} as const
