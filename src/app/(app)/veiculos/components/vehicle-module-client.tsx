"use client";

import { useState } from "react";
import { VehicleKPIs } from "./vehicle-kpis";
import { VehicleManager } from "./vehicle-manager";

export function VehicleModuleClient() {
  const [kpiRefreshKey, setKpiRefreshKey] = useState(0);

  return (
    <main className="module-canvas">
      <header className="px-1 sm:px-2">
        <p className="module-eyebrow">Estoque</p>
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Veículos
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Acompanhe o inventário e gerencie os veículos cadastrados.
        </p>
      </header>
      <VehicleKPIs refreshKey={kpiRefreshKey} />
      <VehicleManager onKpisShouldRefresh={() => setKpiRefreshKey((value) => value + 1)} />
    </main>
  );
}
