"use client";

import { Building2, UserCheck, UserRound, UserX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
