import type { NavigationItem } from "@/components/sidebar/navigation";
import { NavSection } from "@/components/sidebar/components/nav-section";

export function NavSettings({ items }: { items: readonly NavigationItem[] }) {
  return <NavSection label="Ajustes" items={items} />;
}
