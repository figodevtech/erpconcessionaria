"use client";

import { ArrowDownCircle, ArrowUpCircle, Clock3, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { TransactionKpis } from "@/lib/transactions";

export function TransactionKpis({ data }: { data: TransactionKpis }) {
  const items = [
    {
      title: "Receitas",
      value: formatCurrency(data.totalReceitas),
      icon: ArrowUpCircle,
      className: "text-emerald-600",
      hint: "Entradas liquidadas",
    },
    {
      title: "Despesas",
      value: formatCurrency(data.totalDespesas),
      icon: ArrowDownCircle,
      className: "text-red-600",
      hint: "Saidas liquidadas",
    },
    {
      title: "Saldo",
      value: formatCurrency(data.saldo),
      icon: Wallet,
      className: data.saldo >= 0 ? "text-emerald-600" : "text-red-600",
      hint: "Receitas menos despesas",
    },
    {
      title: "Pendentes",
      value: formatCurrency(data.valorPendente),
      icon: Clock3,
      className: "text-amber-600",
      hint: `${data.pendentes} lancamentos em aberto`,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.title} className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            <item.icon className={`h-4 w-4 ${item.className}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{item.value}</div>
            <p className="text-xs text-muted-foreground">{item.hint}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
