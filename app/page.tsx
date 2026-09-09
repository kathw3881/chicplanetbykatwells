import { headers } from "next/headers"
import {
  ShieldCheck,
  CircleCheck,
  CircleAlert,
  Database,
  KeyRound,
  Plug,
  ListChecks,
  Sparkles,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CopyField } from "@/components/copy-field"
import { TOOL_CATALOG } from "@/lib/tool-catalog"
import { getTeemillStatus } from "@/lib/teemill"
import { CORE_COLLECTIONS, RISK_LEVELS } from "@/lib/brand"

export const dynamic = "force-dynamic"

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        ok
          ? "bg-primary/10 text-primary"
          : "bg-destructive/10 text-destructive"
      }`}
    >
      {ok ? (
        <CircleCheck className="size-3.5" aria-hidden />
      ) : (
        <CircleAlert className="size-3.5" aria-hidden />
      )}
      {label}
    </span>
  )
}

export default async function Page() {
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "your-app.vercel.app"
  const proto = h.get("x-forwarded-proto") ?? "https"
  const mcpUrl = `${proto}://${host}/api/mcp`

  const tokenSet = Boolean(process.env.MCP_API_TOKEN)
  const dbSet = Boolean(process.env.DATABASE_URL)
  const teemill = getTeemillStatus()

  const riskOrder = ["draft", "prepare", "write", "dangerous"] as const

  return (
    <main className="mx-auto min-h-dvh w-full max-w-5xl px-4 py-10 md:px-6 md:py-16">
      {/* Header */}
      <header className="mb-10">
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="size-5" aria-hidden />
          </span>
          <Badge variant="secondary" className="font-medium">
            MCP Connector
          </Badge>
        </div>
        <h1 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
          Chic Planet <span className="text-primary">Store Manager</span>
        </h1>
        <p className="mt-2 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
          A secure Model Context Protocol server for{" "}
          <strong className="text-foreground">Chic Planet by Kat Wells</strong>.
          Attach it to a ChatGPT agent so it can draft product copy, designs,
          campaigns, promos and social content for your Teemill store — always
          behind a human approval gate.{" "}
          <span className="italic">Wear Something That Says Something.</span>
        </p>
      </header>

      {/* Status grid */}
      <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <KeyRound className="size-4" aria-hidden /> Connector token
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatusPill ok={tokenSet} label={tokenSet ? "Configured" : "Missing"} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Database className="size-4" aria-hidden /> Database
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatusPill ok={dbSet} label={dbSet ? "Connected" : "Missing"} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Plug className="size-4" aria-hidden /> Teemill API
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatusPill
              ok={teemill.configured}
              label={teemill.configured ? "Configured" : "Optional"}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ListChecks className="size-4" aria-hidden /> Live products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StatusPill
              ok={teemill.capabilities.listProducts}
              label={teemill.capabilities.listProducts ? "Readable" : "Needs key"}
            />
          </CardContent>
        </Card>
      </section>

      {/* Connect section */}
      <Card className="mb-10">
        <CardHeader>
          <CardTitle className="text-lg">Connect to ChatGPT</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <CopyField label="MCP server URL (Streamable HTTP)" value={mcpUrl} />
          <ol className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">1.</span> In ChatGPT,
              open{" "}
              <span className="font-medium text-foreground">
                Settings → Connectors → Create
              </span>{" "}
              (or add a custom connector in a Project / Agent).
            </li>
            <li>
              <span className="font-medium text-foreground">2.</span> Paste the
              MCP server URL above.
            </li>
            <li>
              <span className="font-medium text-foreground">3.</span> Set
              authentication to{" "}
              <span className="font-medium text-foreground">
                Bearer / Access token
              </span>{" "}
              and paste the value of your{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                MCP_API_TOKEN
              </code>
              .
            </li>
            <li>
              <span className="font-medium text-foreground">4.</span> Save. Ask
              the agent to{" "}
              <span className="italic">
                {'"call get_brand_profile, then get_store_status"'}
              </span>{" "}
              to confirm the connection.
            </li>
          </ol>
          <div className="rounded-lg border border-border bg-secondary/40 p-3 text-xs leading-relaxed text-secondary-foreground">
            <ShieldCheck
              className="mr-1.5 inline size-4 align-text-bottom text-primary"
              aria-hidden
            />
            The token is never shown here. It is read from the{" "}
            <code className="font-mono">MCP_API_TOKEN</code> environment variable
            on the server. Rotate it any time in Project Settings → Vars.
          </div>
        </CardContent>
      </Card>

      {/* Safety model */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold">
          Approval &amp; safety levels
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {riskOrder.map((key) => {
            const r = RISK_LEVELS[key]
            const accents: Record<string, string> = {
              draft: "border-l-4 border-l-chart-2",
              prepare: "border-l-4 border-l-secondary-foreground/50",
              write: "border-l-4 border-l-accent",
              dangerous: "border-l-4 border-l-primary",
            }
            return (
              <Card key={key} className={`h-full ${accents[key]}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{r.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {r.description}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          The agent can freely create <strong>drafts</strong>. Anything that would
          change the live store is queued via{" "}
          <code className="font-mono">queue_approval</code> with step-by-step
          manual instructions, and <strong>dangerous</strong> actions
          (deleting/disabling products, price or major homepage changes) require
          explicit <code className="font-mono">confirm=true</code>.
        </p>
      </section>

      {/* Teemill reality note */}
      <Card className="mb-10 border-accent/40">
        <CardHeader>
          <CardTitle className="text-base">About Teemill access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm leading-relaxed text-muted-foreground">
          <p>
            Teemill&apos;s official API supports{" "}
            <strong className="text-foreground">
              create-product-from-image
            </strong>
            , <strong className="text-foreground">orders</strong> and{" "}
            <strong className="text-foreground">product listing/sync</strong>.
            There is{" "}
            <strong className="text-foreground">no public writable API</strong>{" "}
            for editing existing product copy, collections, the homepage hero,
            announcement bars or theme.
          </p>
          <p>
            So those changes use the safe workflow: the agent drafts the content
            and queues clear manual steps for you to apply in your Teemill admin.
            Live product reads light up automatically once your private key is set.
          </p>
        </CardContent>
      </Card>

      {/* Tools */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold">
          Available tools{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({TOOL_CATALOG.reduce((n, g) => n + g.tools.length, 0)})
          </span>
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {TOOL_CATALOG.map((group) => (
            <Card key={group.group} className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{group.group}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {group.tools.map((t) => (
                  <div key={t.name}>
                    <code className="font-mono text-xs font-semibold text-primary">
                      {t.name}
                    </code>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {t.desc}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Collections footer */}
      <Separator className="my-8" />
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Core collections
        </h2>
        <div className="flex flex-wrap gap-2">
          {CORE_COLLECTIONS.map((c) => (
            <Badge key={c} variant="outline" className="font-normal">
              {c}
            </Badge>
          ))}
        </div>
      </section>
    </main>
  )
}
