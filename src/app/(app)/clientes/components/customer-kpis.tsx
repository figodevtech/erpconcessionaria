"use client";

import { Building2, UserCheck, UserRound, UserX } from "lucide-react";
import { ModuleKpi } from "@/components/module/module-kpi";
import type { CustomerKpis } from "@/lib/customers";

export function CustomerKpis({ data }: { data: CustomerKpis }) {
  const items = [
    {
      title: "Clientes",
      value: data.total.toString(),
      hint: "Base cadastrada",
      icon: UserRound,
      className: "text-primary",
    },
    {
      title: "Ativos",
      value: data.active.toString(),
      hint: "Disponíveis para operação",
      icon: UserCheck,
      className: "text-emerald-600",
    },
    {
      title: "Inativos",
      value: data.inactive.toString(),
      hint: "Cadastros desativados",
      icon: UserX,
      className: "text-red-600",
    },
    {
      title: "Empresas",
      value: data.companies.toString(),
      hint: "Clientes pessoa jurídica",
      icon: Building2,
      className: "text-amber-600",
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
