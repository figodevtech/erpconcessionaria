"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { usePathname } from "next/navigation"
import DateTimeBadge from "@/components/date-time-badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { getRouteTitle } from "@/components/sidebar/navigation"

export function DashboardHeader() {
  const pathname = usePathname()
  const title = getRouteTitle(pathname)

  return (
    <header className="flex h-16 w-full min-w-0 shrink-0 items-center gap-2 border-b bg-card/95 px-4 shadow-sm backdrop-blur">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <h2 className="min-w-0 truncate text-base font-medium text-foreground/80 md:text-lg">
        {title}
      </h2>
      <div className="flex-1" />
      <DateTimeBadge />
      <ThemeToggle />
    </header>
  )
}
