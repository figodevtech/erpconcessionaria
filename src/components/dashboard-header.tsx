"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@base-ui/react"
import { usePathname } from "next/navigation"
import DateTimeBadge from "@/components/date-time-badge"
import { ThemeToggle } from "@/components/theme-toggle"

const routeTitles: Record<string, string> = {
  "/": "Dashboard",
  "/clientes": "Clientes",
  "/financeiro": "Fluxo de Caixa",
  "/tipos": "Tipos",
  "/veiculos": "Veículos",
};

function humanize(path: string) {
  const clean = path.split("?")[0].split("#")[0];
  const seg = clean.split("/").filter(Boolean)[0] ?? "";
  if (!seg) return "Dashboard";

  const dic: Record<string, string> = {
    clientes: "Clientes",
    financeiro: "Fluxo de Caixa",
    tipos: "Tipos",
    veiculos: "Veículos",
  };

  return dic[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1);
}

export function DashboardHeader() {
  const pathname = usePathname()
  const title = routeTitles[pathname] ?? humanize(pathname);

  return (
    <header className="flex h-16 w-full shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4 bg-border w-px" />
      <h2 className="text-base md:text-lg font-medium text-foreground/80">{title}</h2>
      <div className="flex-1" />
      <DateTimeBadge />
      <ThemeToggle />
    </header>
  )
}
