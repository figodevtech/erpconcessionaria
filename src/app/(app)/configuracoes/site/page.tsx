"use client"

import { AccessDenied } from "@/components/access-denied"
import { usePermissions } from "@/hooks/use-permissions"
import { Globe2 } from "lucide-react"
import { SiteColorSettings } from "./components/site-color-settings"

export default function SiteSettingsPage() {
  const { hasPermission } = usePermissions()

  if (!hasPermission("settings:view") && !hasPermission("settings:site:view")) {
    return <AccessDenied />
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Cores</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Controle as cores do site público da concessionária.
          </p>
        </div>
      </div>

      <SiteColorSettings />
    </div>
  )
}
