"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CopyField({ label, value }: { label?: string; value: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard may be blocked in the preview iframe; ignore silently.
    }
  }

  return (
    <div className="space-y-1.5">
      {label ? (
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      ) : null}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
        <code className="flex-1 truncate font-mono text-sm text-foreground">
          {value}
        </code>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={copy}
          className="h-7 shrink-0 gap-1.5 px-2"
        >
          {copied ? (
            <>
              <Check className="size-3.5" aria-hidden />
              <span className="text-xs">Copied</span>
            </>
          ) : (
            <>
              <Copy className="size-3.5" aria-hidden />
              <span className="text-xs">Copy</span>
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
