import {
  Car,
  CircleUserRound,
  Handshake,
  Layers3,
  LayoutDashboard,
  Landmark,
  Palette,
  PanelsTopLeft,
  Settings2,
  Users,
  UsersRound,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

export type NavigationItem = {
  title: string;
  icon: LucideIcon;
  url?: string;
  permissions?: readonly string[];
  items?: readonly NavigationItem[];
};

export type NavigationConfig = {
  modules: readonly NavigationItem[];
  settings: readonly NavigationItem[];
};

export const navigation = {
  modules: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      permissions: ["dashboard:view"],
    },
    {
      title: "Clientes",
      url: "/clientes",
      icon: UsersRound,
      permissions: ["customers:view"],
    },
    {
      title: "Veículos",
      url: "/veiculos",
      icon: Car,
      permissions: ["vehicles:view"],
    },
    {
      title: "Vendas",
      url: "/vendas",
      icon: Handshake,
      permissions: ["sales:view"],
    },
    {
      title: "Financeiro",
      icon: WalletCards,
      items: [
        {
          title: "Fluxo de Caixa",
          url: "/financeiro",
          icon: WalletCards,
          permissions: ["finance:view"],
        },
        {
          title: "Bancos",
          url: "/bancos",
          icon: Landmark,
          permissions: ["finance:view"],
        },
      ],
    },
    {
      title: "Banners do site",
      url: "/marketing/banners",
      icon: PanelsTopLeft,
      permissions: ["banners:view"],
    },
  ],
  settings: [
    {
      title: "Configurações",
      icon: Settings2,
      items: [
        {
          title: "Tipos",
          url: "/tipos",
          icon: Layers3,
          permissions: ["types:view"],
        },
        {
          title: "Cores do site",
          url: "/configuracoes/site",
          icon: Palette,
          permissions: ["settings:view", "settings:site:view"],
        },
        {
          title: "Usuários",
          url: "/configuracoes/usuarios",
          icon: Users,
          permissions: ["settings:users:view"],
        },
        {
          title: "Perfis e Permissões",
          url: "/configuracoes/perfis",
          icon: Settings2,
          permissions: ["settings:profiles:view"],
        },
        {
          title: "Contas",
          url: "/configuracoes/contas",
          icon: CircleUserRound,
          permissions: ["settings:view", "settings:accounts:view"],
        },
      ],
    },
  ],
} satisfies NavigationConfig;

function hasPermission(
  requiredPermissions: readonly string[] | undefined,
  permissions: ReadonlySet<string>,
) {
  if (!requiredPermissions?.length) return true;
  if (permissions.has("admin")) return true;
  return requiredPermissions.some((permission) => permissions.has(permission));
}

function filterNavigationItemsWithSet(
  items: readonly NavigationItem[],
  permissions: ReadonlySet<string>,
): NavigationItem[] {
  return items.flatMap((item) => {
    if (item.items) {
      const visibleItems = filterNavigationItemsWithSet(item.items, permissions);

      return visibleItems.length > 0
        ? [{ ...item, items: visibleItems }]
        : [];
    }

    return hasPermission(item.permissions, permissions) ? [{ ...item }] : [];
  });
}

export function filterNavigationItems(
  items: readonly NavigationItem[],
  permissionList: readonly string[],
) {
  return filterNavigationItemsWithSet(items, new Set(permissionList));
}

function normalizePath(path: string) {
  const cleanPath = path.split("?")[0].split("#")[0];
  return cleanPath.replace(/\/+$/, "") || "/";
}

export function isPathActive(href: string | undefined, pathname: string) {
  if (!href || href === "#") return false;

  const normalizedHref = normalizePath(href);
  const normalizedPathname = normalizePath(pathname);

  if (normalizedPathname === normalizedHref) return true;
  if (normalizedHref === "/") return false;

  return normalizedPathname.startsWith(`${normalizedHref}/`);
}

function flattenNavigation(items: readonly NavigationItem[]): NavigationItem[] {
  return items.flatMap((item) => [
    item,
    ...(item.items ? flattenNavigation(item.items) : []),
  ]);
}

const titledRoutes = flattenNavigation([
  ...navigation.modules,
  ...navigation.settings,
])
  .filter((item): item is NavigationItem & { url: string } => Boolean(item.url))
  .sort((left, right) => right.url.length - left.url.length);

export function getRouteTitle(pathname: string) {
  const route = titledRoutes.find((item) => isPathActive(item.url, pathname));
  if (route) return route.title;

  const firstSegment = normalizePath(pathname).split("/").filter(Boolean)[0];
  if (!firstSegment) return "Dashboard";

  return firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1);
}
