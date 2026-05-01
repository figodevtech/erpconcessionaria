"use client";

import { useCallback, useEffect, useState } from "react";
import { CarFront, CheckCircle, DollarSign, Tag } from "lucide-react";
import { getVehicleKpisAction, type VehicleKpisData } from "@/actions/vehicles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Veiculos</CardTitle>
          <CarFront className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalVehicles}</div>
          <p className="text-xs text-muted-foreground">Todos cadastrados</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Disponiveis</CardTitle>
          <Tag className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.availableCount}</div>
          <p className="text-xs text-muted-foreground">Em estoque</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vendidos</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.soldCount}</div>
          <p className="text-xs text-muted-foreground">Status Vendido</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor Medio</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.averageValue)}
          </div>
          <p className="text-xs text-muted-foreground">Dos veiculos disponiveis</p>
        </CardContent>
      </Card>
    </div>
  );
}
