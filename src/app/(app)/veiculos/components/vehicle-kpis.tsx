"use client";

import { useCallback, useEffect, useState } from "react";
import { CarFront, CheckCircle, DollarSign, Tag } from "lucide-react";
import { getVehicleKpisAction, type VehicleKpisData } from "@/actions/vehicles";
import { ModuleKpi, ModuleKpiSkeleton } from "@/components/module/module-kpi";

export function VehicleKPIs({ refreshKey = 0 }: { refreshKey?: number }) {
  const [data, setData] = useState<VehicleKpisData | null>(null);

  const fetchKpis = useCallback(async () => {
    const result = await getVehicleKpisAction();
    if (result.success && result.data) {
      setData(result.data);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(fetchKpis, 0);
    return () => clearTimeout(timeout);
  }, [fetchKpis, refreshKey]);

  if (!data) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ModuleKpiSkeleton />
        <ModuleKpiSkeleton />
        <ModuleKpiSkeleton />
        <ModuleKpiSkeleton />
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <ModuleKpi
        label="Total de Veículos"
        value={data.totalVehicles}
        description="Todos cadastrados"
        icon={CarFront}
      />
      <ModuleKpi
        label="Disponíveis"
        value={data.availableCount}
        description="Em estoque"
        icon={Tag}
      />
      <ModuleKpi
        label="Vendidos"
        value={data.soldCount}
        description="Status Vendido"
        icon={CheckCircle}
        iconClassName="text-emerald-600 dark:text-emerald-400"
      />
      <ModuleKpi
        label="Valor Médio"
        value={new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.averageValue)}
        description="Dos veículos disponíveis"
        icon={DollarSign}
      />
    </div>
  );
}
