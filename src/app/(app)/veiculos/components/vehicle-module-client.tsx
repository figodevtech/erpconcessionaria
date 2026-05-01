"use client";

import { useState } from "react";
import { VehicleKPIs } from "./vehicle-kpis";
import { VehicleManager } from "./vehicle-manager";

export function VehicleModuleClient() {
  const [kpiRefreshKey, setKpiRefreshKey] = useState(0);

  return (
    <div className="flex flex-col gap-6">
      <VehicleKPIs refreshKey={kpiRefreshKey} />
      <VehicleManager onKpisShouldRefresh={() => setKpiRefreshKey((value) => value + 1)} />
    </div>
  );
}
