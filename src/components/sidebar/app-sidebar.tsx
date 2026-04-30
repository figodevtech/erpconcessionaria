"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Car,
  Users,
  Settings2,
  PanelsTopLeft,
  Globe,
  WalletCards,
  Layers3,
} from "lucide-react";
import { NavMain } from "./components/nav-main";
import { NavSettings } from "./components/nav-settings";
import { NavUser } from "./components/nav-user";
import { NavMarketing } from "./components/nav-marketing";

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
      slug: "dashboard:view",
    },
    {
      title: "Clientes",
      url: "/clientes",
      slug: "customers:view",
      icon: Users,
    },
    {
      title: "Veículos",
      url: "/veiculos",
      icon: Car,
      slug: "vehicles:view",
    },
    {
      title: "Fluxo de Caixa",
      url: "/financeiro",
      icon: WalletCards,
      slug: "finance:view",
    },
    {
      title: "Tipos",
      url: "/tipos",
      icon: Layers3,
      slug: "types:view",
    },
  ],

  navWebsite: [
    {
      title: "Website",
      url: "#",
      icon: Globe,
      slug: "website:view",
      items: [
        {
          title: "Banners",
          url: "/marketing/banners",
          icon: PanelsTopLeft,
          slug: "banners:view",
        },
      ],
    },
  ],
  navSettings: [
    {
      title: "Configurações",
      url: "#",
      icon: Settings2,
      slug: "settings:view",
      items: [
        {
          title: "Usuários",
          url: "/configuracoes/usuarios",
          icon: Users,
          slug: "settings:users:view",
        },
        {
          title: "Perfis e Permissões",
          url: "/configuracoes/perfis",
          icon: Settings2,
          slug: "settings:profiles:view",
        },
      ],
    },
  ],
};

export function AppSidebar({
  user,
  permissions = [],
  setOpen,
  hoverHabilitado,
  ...props
}: AppSidebarProps) {
  const effectiveUser = user || null;
  const isAdmin = permissions.includes("admin");

  // Filter menu items based on permissions
  const filteredNavOptions = data.navOptions.filter(
    (item) => !item.slug || isAdmin || permissions.includes(item.slug),
  );

  const filteredNavWebsite = data.navWebsite
    .map((setting) => ({
      ...setting,
      items: setting.items?.filter(
        (item) => !item.slug || isAdmin || permissions.includes(item.slug),
      ),
    }))
    .filter(
      (setting) =>
        !setting.slug ||
        isAdmin ||
        permissions.includes(setting.slug) ||
        (setting.items && setting.items.length > 0),
    );

  const filteredNavSettings = data.navSettings
    .map((setting) => ({
      ...setting,
      items: setting.items?.filter(
        (item) => !item.slug || isAdmin || permissions.includes(item.slug),
      ),
    }))
    .filter(
      (setting) =>
        !setting.slug ||
        isAdmin ||
        permissions.includes(setting.slug) ||
        (setting.items && setting.items.length > 0),
    );

  return (
    <Sidebar
      onMouseOver={() => {
        if (!hoverHabilitado) return;
        setOpen?.(true);
      }}
      collapsible="icon"
      {...props}
    >
      <SidebarContent>
        <NavMain items={filteredNavOptions} />
        <NavMarketing items={filteredNavWebsite} />
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
