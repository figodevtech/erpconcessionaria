"use client"

import { Car, DollarSign, Activity, CreditCard } from "lucide-react"
import { ModuleKpi } from "@/components/module/module-kpi"

type DashboardKPIs = {
  totalVehicles: number;
  totalStockValue: number;
  vehiclesSold: number;
  vehiclesPendingPayment: number;
}

export function VehicleKpiCards({ data }: { data: DashboardKPIs }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <ModuleKpi
        label="Veículos em Estoque"
        value={data.totalVehicles}
        description="Status: Em venda e Repasse"
        icon={Car}
      />
      <ModuleKpi
        label="Valor em Estoque"
        value={new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.totalStockValue)}
        description="Total do preço dos ativos"
        icon={DollarSign}
      />
      <ModuleKpi
        label="Veículos Vendidos"
        value={data.vehiclesSold}
        description="Status: Vendido"
        icon={Activity}
      />
      <ModuleKpi
        label="Pagamentos Pendentes"
        value={data.vehiclesPendingPayment}
        description="Status: Pagamento"
        icon={CreditCard}
      />
    </div>
  )
}
