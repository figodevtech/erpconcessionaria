"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

type SubItem = { title: string; url: string; icon?: LucideIcon };
type Item = {
  title: string;
  url: string; // pode ser "#"
  icon?: LucideIcon;
  isActive?: boolean;
  items?: SubItem[];
};

function pathActive(href: string, pathname: string) {
  if (!href || href === "#") return false;
  if (pathname === href) return true;
  return pathname.startsWith(href.endsWith("/") ? href : href + "/");
}

function NavSettingsCollapsibleItem({ item }: { item: Item & { items: NonNullable<Item["items"]> } }) {
  const uid = React.useId();
  const contentId = `${uid}-content`;
  const pathname = usePathname();

  const isGroupActive = React.useMemo(
    () => item.items?.some((s) => pathActive(s.url, pathname)) ?? false,
    [item.items, pathname]
  );

  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    if (isGroupActive) setOpen(true);
  }, [isGroupActive]);

  return (
    <Collapsible render={<SidebarMenuItem />} open={open} onOpenChange={setOpen} className="group/collapsible">
      <CollapsibleTrigger render={
        <SidebarMenuButton
          isActive={isGroupActive}
          className="hover:text-white transition-all hover:cursor-pointer hover:bg-primary"
          aria-controls={contentId}
        />
      }>
        {item.icon ? <item.icon /> : null}
        <span>{item.title}</span>
        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
      </CollapsibleTrigger>

        <CollapsibleContent id={contentId}>
          <SidebarMenuSub>
            {item.items.map((sub) => {
              const subActive = pathActive(sub.url, pathname);
              return (
                <SidebarMenuSubItem key={sub.title}>
                  <SidebarMenuSubButton
                    render={<Link href={sub.url} aria-current={subActive ? "page" : undefined} title={sub.title} />}
                    isActive={subActive}
                    data-active={subActive || undefined}
                    className="hover:text-white transition-all hover:cursor-pointer hover:bg-primary"
                  >
                    {sub.icon ? <sub.icon /> : null}
                    <span>{sub.title}</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
    </Collapsible>
  );
}

export function NavSettings({ items }: { items: Item[] }) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Ajustes</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          if (item.items?.length) {
            return <NavSettingsCollapsibleItem key={item.title} item={item as any} />;
          }

          const isActive = pathActive(item.url, pathname);

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                render={<Link href={item.url} aria-current={isActive ? "page" : undefined} title={item.title} />}
                isActive={isActive}
                className="hover:text-white transition-all hover:cursor-pointer hover:bg-primary"
              >
                {item.icon ? <item.icon /> : null}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
