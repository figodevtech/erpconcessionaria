"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { AccessDenied } from "@/components/access-denied";
import { ModuleKpiSkeleton } from "@/components/module/module-kpi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCustomersPageDataAction } from "@/actions/customers";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useLazyMount } from "@/hooks/use-lazy-mount";
import { usePermissions } from "@/hooks/use-permissions";
import type {
  Customer,
  CustomerKpis as CustomerKpisType,
  CustomerPersonType,
  CustomerStatus,
} from "@/lib/customers";
import { CustomerFilters } from "./components/customer-filters";
import { CustomerKpis } from "./components/customer-kpis";
import { CustomerTable } from "./components/customer-table";

// Only loaded the first time the user opens the customer form.
const CustomerDialog = dynamic(
  () => import("./components/customer-dialog").then((mod) => mod.CustomerDialog),
  { ssr: false },
)

const pageSize = 12;

export default function ClientesPage() {
  const { hasPermission } = usePermissions();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [kpis, setKpis] = useState<CustomerKpisType | null>(null);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"TODOS" | CustomerStatus>("TODOS");
  const [personType, setPersonType] = useState<"TODOS" | CustomerPersonType>("TODOS");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const debouncedSearch = useDebouncedValue(search);
  const shouldMountCustomerDialog = useLazyMount(dialogOpen);

  const canView = hasPermission("customers:view");
  const canCreate = hasPermission("customers:create");

  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await getCustomersPageDataAction({
      page,
      pageSize,
      search: debouncedSearch,
      status,
      personType,
    });

    if (result.success && result.data) {
      setCustomers(result.data.customers);
      setCount(result.data.count);
      setKpis(result.data.kpis);
    } else {
      toast.error(result.error ?? "Erro ao carregar clientes");
    }
    setLoading(false);
  }, [debouncedSearch, page, personType, status]);

  useEffect(() => {
    if (!canView) return;
    // Deferred by a tick (not debounced) so the loading flag does not cascade
    // an extra render inside the effect.
    const timeout = setTimeout(refresh, 0);
    return () => clearTimeout(timeout);
  }, [canView, refresh]);

  if (!canView) return <AccessDenied />;

  return (
    <div className="flex flex-col gap-8">
      {!kpis ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ModuleKpiSkeleton />
          <ModuleKpiSkeleton />
          <ModuleKpiSkeleton />
          <ModuleKpiSkeleton />
        </div>
      ) : (
        <CustomerKpis data={kpis} />
      )}

      <CustomerFilters
        search={search}
        setSearch={setSearch}
        status={status}
        setStatus={setStatus}
        personType={personType}
        setPersonType={setPersonType}
        setPage={setPage}
      />

      <Card>
        <CardHeader className="border-b-2 pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle>
                Clientes | <span className="font-mono font-normal text-muted-foreground">{count} resultados</span>
              </CardTitle>
              <CardDescription className="mt-1">
                <button
                  onClick={refresh}
                  disabled={loading}
                  className="inline-flex items-center gap-1 text-foreground/50 hover:text-foreground/70 hover:cursor-pointer disabled:opacity-50"
                >
                  <span>Recarregar</span>
                  <Loader2 width={12} className={loading ? "animate-spin" : ""} />
                </button>
              </CardDescription>
            </div>

            {canCreate && (
              <Button size="sm" className="rounded-xl shadow-lg" onClick={() => setDialogOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Novo cliente
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="relative -mt-[24px] min-h-[420px] px-4 pb-4 pt-6">
          <div className={`${loading ? "opacity-100" : "opacity-0"} absolute left-0 right-0 top-2 h-0.5 overflow-hidden bg-slate-400 transition-all`}>
            <div className={`${loading ? "animate-slideIn" : ""} absolute left-0 h-full w-1/2 -translate-x-full rounded-lg bg-primary`} />
          </div>

          <CustomerTable
            customers={customers}
            loading={loading}
            onSuccess={refresh}
            page={page}
            setPage={setPage}
            count={count}
            pageSize={pageSize}
          />
        </CardContent>
      </Card>

      {shouldMountCustomerDialog ? (
        <CustomerDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={refresh}
        />
      ) : null}
    </div>
  );
}
