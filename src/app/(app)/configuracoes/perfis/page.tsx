import { ProfileKPIs } from "./components/profile-kpis";
import { ProfileManagerClient } from "./components/profile-manager-client";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { checkPermission } from "@/utils/permissions";
import { AccessDenied } from "@/components/access-denied";

export default async function ProfilesPage() {
  const hasViewPermission = await checkPermission("settings:profiles:view");
  if (!hasViewPermission) return <AccessDenied />;

  return (
    <div className="flex flex-col gap-8">
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        }
      >
        <ProfileKPIs />
      </Suspense>

      <ProfileManagerClient />
    </div>
  );
}
