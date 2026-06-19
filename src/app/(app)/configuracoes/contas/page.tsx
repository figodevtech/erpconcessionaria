"use client";

import { AccessDenied } from "@/components/access-denied";
import { usePermissions } from "@/hooks/use-permissions";
import { InstagramAccountCard } from "./components/instagram-account-card";

export default function AccountsSettingsPage() {
  const { hasPermission } = usePermissions();

  if (!hasPermission("settings:view") && !hasPermission("settings:accounts:view")) {
    return <AccessDenied />;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Contas</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Gerencie contas externas conectadas ao sistema.
          </p>
        </div>
      </div>

      <div className="max-w-3xl">
        <InstagramAccountCard />
      </div>
    </div>
  );
}
