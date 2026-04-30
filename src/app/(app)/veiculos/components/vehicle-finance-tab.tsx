"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, ReceiptText } from "lucide-react";
import { getTransactionKpisAction, listTransactionsAction } from "@/actions/transactions";
import { TransactionDialog } from "@/components/finance/transaction-dialog";
import { TransactionKpis } from "@/components/finance/transaction-kpis";
import { TransactionTable } from "@/components/finance/transaction-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermissions } from "@/hooks/use-permissions";
import type { Transaction, TransactionKpis as TransactionKpisType } from "@/lib/transactions";
import type { Vehicle } from "./vehicle-list-client";

export function VehicleFinanceTab({ vehicle }: { vehicle: Vehicle }) {
  const { hasPermission } = usePermissions();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [kpis, setKpis] = useState<TransactionKpisType | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const canCreate = hasPermission("finance:create");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const vehicleId = Number(vehicle.id);
    const [listResult, kpiResult] = await Promise.all([
      listTransactionsAction({ vehicleId, pageSize: 50 }),
      getTransactionKpisAction(vehicleId),
    ]);

    if (listResult.success) {
      setTransactions(listResult.data ?? []);
    }

    if (kpiResult.success && kpiResult.data) {
      setKpis(kpiResult.data);
    }

    setLoading(false);
  }, [vehicle.id]);

  useEffect(() => {
    const timeout = setTimeout(fetchData, 0);
    return () => clearTimeout(timeout);
  }, [fetchData]);

  return (
    <div className="flex flex-col gap-8 p-1">
      {kpis ? (
        <TransactionKpis data={kpis} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      )}

      <Card>
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <ReceiptText className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base">Lancamentos do veiculo</CardTitle>
                <button
                  type="button"
                  onClick={fetchData}
                  disabled={loading}
                  className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  <span>Recarregar</span>
                  <Loader2 className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {canCreate && (
              <Button type="button" size="sm" className="rounded-xl" onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nova transacao
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <TransactionTable transactions={transactions} loading={loading} onChanged={fetchData} compact />
        </CardContent>
      </Card>

      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchData}
        vehicle={{
          id: vehicle.id,
          brand: vehicle.brand,
          model: vehicle.model,
          plate: vehicle.plate,
        }}
      />
    </div>
  );
}
