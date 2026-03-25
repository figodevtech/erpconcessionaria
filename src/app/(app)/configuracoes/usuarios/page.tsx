import { listUsersAction } from "@/actions/users";
import { getRolesAction } from "@/actions/roles";
import { UserKPIs } from "./components/user-kpis";
import { UserManagerClient } from "./components/user-manager-client";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { checkPermission } from "@/utils/permissions";
import { AccessDenied } from "@/components/access-denied";

export default async function UsersPage() {
  const hasViewPermission = await checkPermission("settings:users:view");
  if (!hasViewPermission) return <AccessDenied />;

  const { data: roles } = await getRolesAction();

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
        <UserKPIs />
      </Suspense>

      <UserManagerClient initialProfiles={roles || []} />
    </div>
  );
}
