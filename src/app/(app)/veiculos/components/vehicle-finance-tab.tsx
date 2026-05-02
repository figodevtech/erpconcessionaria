"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  BadgePercent,
  Car,
  DollarSign,
  Loader2,
  Plus,
  ReceiptText,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { getTransactionKpisAction, listTransactionsAction } from "@/actions/transactions";
import { TransactionDialog } from "@/components/finance/transaction-dialog";
import { TransactionTable } from "@/components/finance/transaction-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermissions } from "@/hooks/use-permissions";
import { formatCurrency } from "@/lib/utils";
import type { Transaction, TransactionKpis as TransactionKpisType } from "@/lib/transactions";
import type { Vehicle } from "./vehicle-list-client";

export function VehicleFinanceTab({ vehicle, onSuccess }: { vehicle: Vehicle, onSuccess?: (updatedVehicle?: Vehicle) => void }) {
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
        <VehicleFinancialKpis vehicle={vehicle} data={kpis} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
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
                <CardTitle className="text-base">Lançamentos do veículo</CardTitle>
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
                Nova transação
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <TransactionTable 
            transactions={transactions} 
            loading={loading} 
            onChanged={(v) => {
              fetchData();
              if (onSuccess) onSuccess(v);
            }} 
            compact 
          />
        </CardContent>
      </Card>

      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={(v) => {
          fetchData();
          if (onSuccess) onSuccess(v);
          setDialogOpen(false);
        }}
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

function VehicleFinancialKpis({
  vehicle,
  data,
}: {
  vehicle: Vehicle;
  data: TransactionKpisType;
}) {
  const fipe = Number(vehicle.fipe ?? 0);
  const purchasePrice = Number(vehicle.purchase_price ?? 0);
  const salePrice = Number(vehicle.price ?? 0);
  const expenses = Number(data.totalDespesas ?? 0);
  const revenues = Number(data.totalReceitas ?? 0);
  const currentCost = purchasePrice + expenses - revenues;
  const expectedProfit = salePrice - currentCost;
  const expectedProfitPercent = currentCost > 0 ? (expectedProfit / currentCost) * 100 : 0;


  const itemsGrid = [
    {
      title: "PREÇO FIPE",
      value: formatCurrency(fipe),
      hint: "Valor FIPE cadastrado",
      icon: Car,
      className: "text-sky-600",
    },
    {
      title: "COMPRADO POR",
      value: formatCurrency(purchasePrice),
      hint: "Preço de compra definido no cadastro",
      icon: Wallet,
      className: "text-violet-600",
    },
    {
      title: "CUSTO ATUAL DO CARRO",
      value: formatCurrency(currentCost),
      hint: "Compra + despesas - receitas",
      icon: ReceiptText,
      className: currentCost >= 0 ? "text-amber-600" : "text-emerald-600",
    },
    {
      title: "VALOR DE VENDA",
      value: formatCurrency(salePrice),
      hint: "Definido no cadastro do veículo",
      icon: DollarSign,
      className: "text-primary",
    },
  ]

  const itemsList = [


    {
      title: "DESPESAS",
      value: formatCurrency(expenses),
      hint: "Registradas no financeiro",
      icon: ArrowDownCircle,
      className: "text-red-600",
    },
    {
      title: "RECEITAS",
      value: formatCurrency(revenues),
      hint: "Registradas no financeiro",
      icon: ArrowUpCircle,
      className: "text-emerald-600",
    },
    {
      title: "LUCRO PREVISTO",
      value: formatCurrency(expectedProfit),
      hint: "Valor de venda - custo atual",
      icon: TrendingUp,
      className: expectedProfit >= 0 ? "text-emerald-600" : "text-red-600",
    },
    {
      title: "PERCENTUAL DE LUCRO PREVISTO",
      value: `${expectedProfitPercent.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}%`,
      hint: "Lucro previsto sobre o custo atual",
      icon: BadgePercent,
      className: expectedProfitPercent >= 0 ? "text-emerald-600" : "text-red-600",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-2 xl:grid-cols-2">

      <div className="grid gap-4 grid-cols-2 md:grid-cols-2 xl:grid-cols-2">
        {itemsGrid.map((item) => (
          <Card key={item.title} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className=" text-[10px] md:text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {item.title}
              </CardTitle>
              <item.icon className={`h-4 w-4 ${item.className}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-sm md:text-xl font-bold tracking-tight ${item.className}`}>
                {item.value}
              </div>
              <p className="mt-1 text-[10px] md:text-xs text-muted-foreground">{item.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 gri  d-cols-2 md:grid-cols-2 xl:grid-cols-2">
        {itemsList.map((item) => (
          <Card key={item.title} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className=" text-[10px] md:text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {item.title}
              </CardTitle>
              <item.icon className={`h-4 w-4 ${item.className}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-sm md:text-xl font-bold tracking-tight ${item.className}`}>
                {item.value}
              </div>
              <p className="mt-1 text-[10px] md:text-xs text-muted-foreground">{item.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>

  );
}
