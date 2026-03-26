"use client"

import { useState, useCallback, useEffect } from "react";
import { getRolesAction } from "@/actions/roles";
import { UserKPIs } from "./components/user-kpis";
import { UserManagerClient } from "./components/user-manager-client";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermissions } from "@/hooks/use-permissions";
import { AccessDenied } from "@/components/access-denied";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserFilters } from "./components/user-filters";
import { listUsersAction, getUserKPIsAction } from "@/actions/users";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserDialog } from "./components/user-dialog";

interface Profile {
  id: number;
  name: string;
  description?: string;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  profile_id: number;
  active: boolean;
  profile?: {
    name: string;
  };
}

export default function UsersPage() {
  const { hasPermission } = usePermissions();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [roles, setRoles] = useState<Profile[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [kpiData, setKpiData] = useState<{
    totalUsers: number;
    activeUsers: number;
    uniqueProfiles: number;
    inactiveUsers: number;
  } | null>(null);
  const [kpiLoading, setKpiLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const result = await listUsersAction({ page, pageSize, search });
    if (result.success) {
      setUsers(result.data || []);
      setCount(result.count || 0);
    }
    setLoading(false);
  }, [page, search]);

  const fetchRoles = useCallback(async () => {
    const { data } = await getRolesAction();
    setRoles(data || []);
  }, []);

  const fetchKPIs = useCallback(async () => {
    setKpiLoading(true);
    const result = await getUserKPIsAction();
    if (result.success) {
      setKpiData(result.data || null);
    }
    setKpiLoading(false);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchUsers();
      fetchRoles();
      fetchKPIs();
    }, 100);

    return () => clearTimeout(timeout);
  }, [fetchUsers, fetchRoles, fetchKPIs]);

  const handleNew = () => {
    setSelectedUser(null);
    setDialogOpen(true);
  };

  if (!hasPermission("settings:users:view")) {
    return <AccessDenied />;
  }

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
        {kpiLoading || !kpiData ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        ) : (
          <UserKPIs data={kpiData} />
        )}
      </Suspense>

      <UserFilters search={search} setSearch={setSearch} setPage={setPage} />

      <Card>
        <CardHeader className="border-b-2 pb-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>
                Lista de Usuários | <span className="text-muted-foreground font-normal font-mono">{count} resultados</span>
              </CardTitle>
              <CardDescription className="mt-1">
                <button
                  onClick={() => fetchUsers()}
                  disabled={loading}
                  className="inline-flex items-center gap-1 text-foreground/50 hover:text-foreground/70 hover:cursor-pointer disabled:opacity-50"
                >
                  <span>Recarregar</span>
                  <Loader2
                    width={12}
                    className={loading ? "animate-spin" : ""}
                  />
                </button>
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {hasPermission("settings:users:create") && (
                <Button onClick={handleNew} size="sm" className="rounded-xl shadow-lg">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Novo Usuário
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="min-h-[300px] -mt-[24px] px-4 pb-4 pt-6 relative">
          <div
            className={`${loading && " opacity-100"
              } transition-all opacity-0 h-0.5 bg-slate-400 w-full overflow-hidden absolute left-0 right-0 top-2`}
          >
            <div
              className={`w-1/2 bg-primary h-full absolute left-0 rounded-lg -translate-x-full ${loading && "animate-slideIn "
                }`}
            />
          </div>
          <div className="relative min-h-[400px]">
            <div className="rounded-md border">
              <UserManagerClient
                users={users}
                loading={loading}
                onSuccess={fetchUsers}
                page={page}
                setPage={setPage}
                count={count}
                pageSize={pageSize}
                initialProfiles={roles}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={selectedUser}
        profiles={roles}
        onSuccess={fetchUsers}
      />
    </div>
  );
}
