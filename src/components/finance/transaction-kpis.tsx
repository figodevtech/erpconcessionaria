"use client";

import { ArrowDownCircle, ArrowUpCircle, Clock3, Wallet } from "lucide-react";
import { ModuleKpi } from "@/components/module/module-kpi";
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
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <ModuleKpi
          key={item.title}
          label={item.title}
          value={item.value}
          description={item.hint}
          icon={item.icon}
          iconClassName={item.className}
        />
      ))}
    </div>
  );
}
