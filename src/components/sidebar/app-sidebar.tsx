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
  permissions?: string[];
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
      slug: "dashboard:view"
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
      slug: "vehicles:read"
    },

  ],
  navSettings: [
    {
      title: "Configurações",
      url: "#",
      icon: Settings2,
      slug: "settings:manage",
      items: [
        {
          title: "Site",
          url: "#",
          icon: PanelsTopLeft,
        },
        {
          title: "Usuários",
          url: "/configuracoes/usuarios",
          icon: Users,
          slug: "users:manage"
        },
        {
          title: "Perfis e Permissões",
          url: "/configuracoes/perfis",
          icon: Settings2,
          slug: "settings:manage"
        }
      ]
    }
  ]
}

export function AppSidebar({ user, permissions = [], setOpen, hoverHabilitado, ...props }: AppSidebarProps) {

  const effectiveUser = user || null;

  // Filter menu items based on permissions
  const filteredNavOptions = data.navOptions.filter(item => 
    !item.slug || permissions.includes(item.slug)
  )

  const filteredNavSettings = data.navSettings.map(setting => ({
    ...setting,
    items: setting.items?.filter(item => !item.slug || permissions.includes(item.slug))
  })).filter(setting => 
    (!setting.slug || permissions.includes(setting.slug)) || (setting.items && setting.items.length > 0)
  )

  return (
    <Sidebar onMouseOver={() => {
      if (!hoverHabilitado) return;
      setOpen?.(true)
    }} collapsible="icon" {...props}>
      <SidebarContent>
        <NavMain items={filteredNavOptions} />
        <NavSettings items={filteredNavSettings} />
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
