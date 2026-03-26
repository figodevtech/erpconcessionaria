"use client"

import { useState, useCallback, useEffect } from "react";
import { getRolesAction, getProfileKPIsAction, getPermissionsAction } from "@/actions/roles";
import { ProfileKPIs } from "./components/profile-kpis";
import { ProfileManagerClient } from "./components/profile-manager-client";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermissions } from "@/hooks/use-permissions";
import { AccessDenied } from "@/components/access-denied";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileFilters } from "./components/profile-filters";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileDialog } from "./components/profile-dialog";

interface Permission {
  id: number;
  slug: string;
  module: string;
  action: string;
  description?: string;
}

interface Profile {
  id: number;
  name: string;
  description?: string;
  role_permissions?: { permission_slug: string }[];
}

export default function ProfilesPage() {
  const { hasPermission } = usePermissions();
  
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [kpiData, setKpiData] = useState<{
    totalProfiles: number;
    totalPermissions: number;
    avgPermissions: number;
    assignedProfiles: number;
  } | null>(null);
  const [kpiLoading, setKpiLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    const result = await getRolesAction({ page, pageSize, search });
    if (result.success) {
      setProfiles(result.data || []);
      setCount(result.count || 0);
    }
    setLoading(false);
  }, [page, search]);

  const fetchKPIs = useCallback(async () => {
    setKpiLoading(true);
    const result = await getProfileKPIsAction();
    if (result.success) {
      setKpiData(result.data || null);
    }
    setKpiLoading(false);
  }, []);

  const fetchPermissions = useCallback(async () => {
    const { data } = await getPermissionsAction();
    setAllPermissions(data || []);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchProfiles();
      fetchKPIs();
      fetchPermissions();
    }, 100);

    return () => clearTimeout(timeout);
  }, [fetchProfiles, fetchKPIs, fetchPermissions]);

  const handleNew = () => {
    setIsCreateDialogOpen(true);
  };

  if (!hasPermission("settings:profiles:view")) {
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
          <ProfileKPIs data={kpiData} />
        )}
      </Suspense>

      <ProfileFilters search={search} setSearch={setSearch} setPage={setPage} />

      <Card>
        <CardHeader className="border-b-2 pb-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>
                Gestão de Cargos | <span className="text-muted-foreground font-normal font-mono">{count} resultados</span>
              </CardTitle>
              <CardDescription className="mt-1">
                <button
                  onClick={() => fetchProfiles()}
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
              {hasPermission("settings:profiles:create") && (
                <Button onClick={handleNew} size="sm" className="rounded-xl shadow-lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Perfil
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
              <ProfileManagerClient
                profiles={profiles}
                loading={loading}
                onSuccess={() => {
                  fetchProfiles();
                  fetchKPIs();
                }}
                page={page}
                setPage={setPage}
                count={count}
                pageSize={pageSize}
                allPermissions={allPermissions}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <ProfileDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        allPermissions={allPermissions}
        onSuccess={() => {
          fetchProfiles();
          fetchKPIs();
        }}
      />
    </div>
  );
}
