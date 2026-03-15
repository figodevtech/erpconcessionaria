"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar"
import { LayoutDashboard, Car, Users, Settings2, PanelsTopLeft } from "lucide-react"
import { usePathname } from "next/navigation"
import { NavMain } from "./components/nav-main"
import { NavSettings } from "./components/nav-settings"
import { NavUser } from "./components/nav-user"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    nome: string;
    email: string;
  } | null;
  setOpen?: (open: boolean) => void;
  hoverHabilitado?: boolean;
}

// Menu items.
const data = {
  navOptions: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Clientes",
      url: "/clientes",
      icon: Users,
    },
    {
      title: "Veículos",
      url: "/veiculos",
      icon: Car,
    },

  ],
  navSettings: [
    {
      title: "Configurações",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "Site",
          url: "#",
          icon: PanelsTopLeft,
        },
      ]
    }
  ]
}

export function AppSidebar({ user, setOpen, hoverHabilitado, ...props }: AppSidebarProps) {

  const effectiveUser = user || null;

  return (
    <Sidebar onMouseOver={() => {
      if (!hoverHabilitado) return;
      setOpen?.(true)
    }} collapsible="icon" {...props}>
      <SidebarContent>
        <NavMain items={data.navOptions} />
        <NavSettings items={data.navSettings} />
      </SidebarContent>
      <SidebarFooter>
        {effectiveUser && (
          <NavUser
            user={{
              nome: effectiveUser.nome || "",
              email: effectiveUser.email || "",
            }}
          />
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
