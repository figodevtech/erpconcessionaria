"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Search } from "lucide-react";
import { AccessDenied } from "@/components/access-denied";
import { TransactionDialog } from "@/components/finance/transaction-dialog";
import { TransactionKpis } from "@/components/finance/transaction-kpis";
import { TransactionTable } from "@/components/finance/transaction-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermissions } from "@/hooks/use-permissions";
import { getTransactionKpisAction, listTransactionsAction } from "@/actions/transactions";
import type { Transaction, TransactionKpis as TransactionKpisType, TransactionType } from "@/lib/transactions";

const pageSize = 12;

export default function CashFlowPage() {
  const { hasPermission } = usePermissions();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [kpis, setKpis] = useState<TransactionKpisType | null>(null);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [tipo, setTipo] = useState<"TODOS" | TransactionType>("TODOS");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const canView = hasPermission("finance:view");
  const canCreate = hasPermission("finance:create");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [listResult, kpiResult] = await Promise.all([
      listTransactionsAction({ page, pageSize, search, tipo }),
      getTransactionKpisAction(),
    ]);

    if (listResult.success) {
      setTransactions(listResult.data ?? []);
      setCount(listResult.count ?? 0);
    }

    if (kpiResult.success && kpiResult.data) {
      setKpis(kpiResult.data);
    }

    setLoading(false);
  }, [page, search, tipo]);

  useEffect(() => {
    if (!canView) return;
    const timeout = setTimeout(fetchData, 200);
    return () => clearTimeout(timeout);
  }, [canView, fetchData]);

  if (!canView) return <AccessDenied />;

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  return (
    <div className="flex flex-col gap-8">
      {kpis ? (
        <TransactionKpis data={kpis} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      )}

      <Card>
        <CardHeader className="border-b-2 pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle>
                Fluxo de Caixa | <span className="font-mono font-normal text-muted-foreground">{count} resultados</span>
              </CardTitle>
              <CardDescription className="mt-1">
                <button
                  onClick={fetchData}
                  disabled={loading}
                  className="inline-flex items-center gap-1 text-foreground/50 hover:text-foreground/70 disabled:opacity-50"
                >
                  <span>Recarregar</span>
                  <Loader2 width={12} className={loading ? "animate-spin" : ""} />
                </button>
              </CardDescription>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative min-w-[240px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Buscar descrição, categoria..."
                  className="pl-9"
                />
              </div>
              <Select
                value={tipo}
                onValueChange={(value) => {
                  setTipo(value as "TODOS" | TransactionType);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full md:w-[170px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value="RECEITA">Receitas</SelectItem>
                  <SelectItem value="DESPESA">Despesas</SelectItem>
                </SelectContent>
              </Select>
              {canCreate && (
                <Button size="sm" className="rounded-xl" onClick={() => setDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova transação
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative -mt-[24px] min-h-[420px] px-4 pb-4 pt-6">
          <div className={`${loading ? "opacity-100" : "opacity-0"} absolute left-0 right-0 top-2 h-0.5 overflow-hidden bg-slate-400 transition-all`}>
            <div className={`${loading ? "animate-slideIn" : ""} absolute left-0 h-full w-1/2 -translate-x-full rounded-lg bg-primary`} />
          </div>

          <TransactionTable transactions={transactions} loading={loading} onChanged={fetchData} />

          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
                Anterior
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}>
                Próxima
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <TransactionDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={fetchData} />
    </div>
  );
}
