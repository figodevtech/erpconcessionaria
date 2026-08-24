"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  isPathActive,
  type NavigationItem,
} from "@/components/sidebar/navigation";

type NavigationGroupItem = NavigationItem & {
  items: readonly NavigationItem[];
};

function hasChildren(item: NavigationItem): item is NavigationGroupItem {
  return Boolean(item.items?.length);
}

function isItemActive(item: NavigationItem, pathname: string): boolean {
  if (isPathActive(item.url, pathname)) return true;
  return item.items?.some((child) => isItemActive(child, pathname)) ?? false;
}

function CollapsibleNavigationItem({
  item,
  pathname,
  onNavigate,
}: {
  item: NavigationGroupItem;
  pathname: string;
  onNavigate: () => void;
}) {
  const contentId = `${useId()}-content`;
  const isGroupActive = item.items.some((child) =>
    isItemActive(child, pathname),
  );
  const [userOpen, setUserOpen] = useState(false);
  const open = isGroupActive || userOpen;
  const Icon = item.icon;

  return (
    <Collapsible
      render={<SidebarMenuItem />}
      open={open}
      onOpenChange={setUserOpen}
      className="group/collapsible"
    >
      <CollapsibleTrigger
        render={
          <SidebarMenuButton
            isActive={isGroupActive}
            aria-controls={contentId}
            aria-expanded={open}
            title={item.title}
            className="cursor-pointer transition-colors duration-200"
          />
        }
      >
        <Icon aria-hidden="true" />
        <span>{item.title}</span>
        <ChevronRight
          aria-hidden="true"
          className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 group-data-[collapsible=icon]:hidden"
        />
      </CollapsibleTrigger>

      <CollapsibleContent id={contentId}>
        <SidebarMenuSub>
          {item.items.map((child) => {
            if (!child.url) return null;

            const childActive = isPathActive(child.url, pathname);
            const ChildIcon = child.icon;

            return (
              <SidebarMenuSubItem key={child.url}>
                <SidebarMenuSubButton
                  render={
                    <Link
                      href={child.url}
                      onClick={onNavigate}
                      aria-current={childActive ? "page" : undefined}
                      title={child.title}
                    />
                  }
                  isActive={childActive}
                  className="transition-colors duration-200"
                >
                  <ChildIcon aria-hidden="true" />
                  <span>{child.title}</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            );
          })}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function NavSection({
  label,
  items,
}: {
  label: string;
  items: readonly NavigationItem[];
}) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  if (items.length === 0) return null;

  const closeMobileNavigation = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          if (hasChildren(item)) {
            return (
              <CollapsibleNavigationItem
                key={item.title}
                item={item}
                pathname={pathname}
                onNavigate={closeMobileNavigation}
              />
            );
          }

          if (!item.url) return null;

          const active = isPathActive(item.url, pathname);
          const Icon = item.icon;

          return (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton
                render={
                  <Link
                    href={item.url}
                    onClick={closeMobileNavigation}
                    aria-current={active ? "page" : undefined}
                    title={item.title}
                  />
                }
                isActive={active}
                className="transition-colors duration-200"
              >
                <Icon aria-hidden="true" />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
