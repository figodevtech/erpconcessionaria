import type { NavigationItem } from "@/components/sidebar/navigation";
import { NavSection } from "@/components/sidebar/components/nav-section";

export function NavMain({ items }: { items: readonly NavigationItem[] }) {
  return <NavSection label="Módulos" items={items} />;
}
