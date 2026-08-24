"use client";

import { useMemo } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavMain } from "@/components/sidebar/components/nav-main";
import { NavSettings } from "@/components/sidebar/components/nav-settings";
import { NavUser } from "@/components/sidebar/components/nav-user";
import {
  filterNavigationItems,
  navigation,
} from "@/components/sidebar/navigation";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    nome: string;
    email: string;
  } | null;
  permissions?: readonly string[];
}

export function AppSidebar({
  user,
  permissions = [],
  ...props
}: AppSidebarProps) {
  const modules = useMemo(
    () => filterNavigationItems(navigation.modules, permissions),
    [permissions],
  );
  const settings = useMemo(
    () => filterNavigationItems(navigation.settings, permissions),
    [permissions],
  );

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent className="py-2">
        <NavMain items={modules} />
        <NavSettings items={settings} />
      </SidebarContent>

      {user ? (
        <SidebarFooter className="border-t border-sidebar-border">
          <NavUser user={user} />
        </SidebarFooter>
      ) : null}

      <SidebarRail />
    </Sidebar>
  );
}
