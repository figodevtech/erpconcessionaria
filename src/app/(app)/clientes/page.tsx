"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { AccessDenied } from "@/components/access-denied";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCustomerKpisAction, listCustomersAction } from "@/actions/customers";
import { usePermissions } from "@/hooks/use-permissions";
import type {
  Customer,
  CustomerKpis as CustomerKpisType,
  CustomerPersonType,
  CustomerStatus,
} from "@/lib/customers";
import { CustomerDialog } from "./components/customer-dialog";
import { CustomerFilters } from "./components/customer-filters";
import { CustomerKpis } from "./components/customer-kpis";
import { CustomerTable } from "./components/customer-table";

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

  const canView = hasPermission("customers:view");
  const canCreate = hasPermission("customers:create");

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const result = await listCustomersAction({ page, pageSize, search, status, personType });
    if (result.success) {
      setCustomers(result.data ?? []);
      setCount(result.count ?? 0);
    } else {
      toast.error(result.error ?? "Erro ao carregar clientes");
    }
    setLoading(false);
  }, [page, personType, search, status]);

  const fetchKpis = useCallback(async () => {
    const result = await getCustomerKpisAction();
    if (result.success && result.data) {
      setKpis(result.data);
    }
  }, []);

  const refresh = useCallback(() => {
    fetchCustomers();
    fetchKpis();
  }, [fetchCustomers, fetchKpis]);

  useEffect(() => {
    if (!canView) return;
    const timeout = setTimeout(refresh, 150);
    return () => clearTimeout(timeout);
  }, [canView, refresh]);

  if (!canView) return <AccessDenied />;

  return (
    <div className="flex flex-col gap-8">
      {!kpis ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
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

      <CustomerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={refresh}
      />
    </div>
  );
}
