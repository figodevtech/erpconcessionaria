"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Car, DollarSign, Activity, CreditCard } from "lucide-react"

type DashboardKPIs = {
  totalVehicles: number;
  totalStockValue: number;
  vehiclesSold: number;
  vehiclesPendingPayment: number;
}

export function VehicleKpiCards({ data }: { data: DashboardKPIs }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4">
      
      {/* Veículos em Estoque (Em venda) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="tracking-tight text-sm font-medium">Veículos em Estoque</CardTitle>
          <Car className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalVehicles}</div>
          <p className="text-xs text-muted-foreground mt-1 cursor-default">
            Status: "Em venda"
          </p>
        </CardContent>
      </Card>

      {/* Valor em Estoque */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="tracking-tight text-sm font-medium">Valor em Estoque</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.totalStockValue)}
          </div>
          <p className="text-xs text-muted-foreground mt-1 cursor-default">
            Total do preço dos ativos
          </p>
        </CardContent>
      </Card>

      {/* Veículos Vendidos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="tracking-tight text-sm font-medium">Veículos Vendidos</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.vehiclesSold}</div>
          <p className="text-xs text-muted-foreground mt-1 cursor-default">
            Status: "Vendido"
          </p>
        </CardContent>
      </Card>

      {/* Aguardando Pagamento */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="tracking-tight text-sm font-medium">Pagamentos Pendentes</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.vehiclesPendingPayment}</div>
          <p className="text-xs text-muted-foreground mt-1 cursor-default">
            Status: "Pagamento"
          </p>
        </CardContent>
      </Card>

    </div>
  )
}
