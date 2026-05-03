"use client";

import { useState } from "react";
import { SalesKPIs } from "./sales-kpis";
import { SalesManager } from "./sales-manager";

export function SalesModuleClient() {
  const [kpiRefreshKey, setKpiRefreshKey] = useState(0);

  return (
    <div className="flex flex-col gap-6">
      <SalesKPIs refreshKey={kpiRefreshKey} />
      <SalesManager onKpisShouldRefresh={() => setKpiRefreshKey((value) => value + 1)} />
    </div>
  );
}
