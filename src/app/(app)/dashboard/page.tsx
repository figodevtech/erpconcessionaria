import { createClient } from "@/utils/supabase/server"
import { VehicleKpiCards } from "./components/vehicle-kpi-cards"
import { VehicleStatusChart } from "./components/vehicle-status-chart"
import { VehicleBrandChart } from "./components/vehicle-brand-chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { checkPermission } from "@/utils/permissions"
import { AccessDenied } from "@/components/access-denied"

export default async function Dashboard() {
  const hasViewPermission = await checkPermission("dashboard:view")
  if (!hasViewPermission) return <AccessDenied />

  const supabase = await createClient()

  // Buscar todos os veículos ativos (não deletados)
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("status, price, brand")
    .eq("deleted", false)

  const activeVehicles = vehicles || []

  // Calcular KPIs
  const totalVehicles = activeVehicles.filter(v => v.status === "Em venda").length
  const totalStockValue = activeVehicles
    .filter(v => v.status === "Em venda")
    .reduce((acc, v) => acc + (v.price || 0), 0)
  const vehiclesSold = activeVehicles.filter(v => v.status === "Vendido").length
  const vehiclesPendingPayment = activeVehicles.filter(v => v.status === "Pagamento").length

  const kpis = {
    totalVehicles,
    totalStockValue,
    vehiclesSold,
    vehiclesPendingPayment
  }

  // Preparar dados para o gráfico de Status
  const statusCounts = activeVehicles.reduce((acc, v) => {
    const status = v.status || "Indefinido";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = Object.keys(statusCounts).map(key => ({
    name: key,
    value: statusCounts[key]
  })).sort((a, b) => b.value - a.value); // Ordena do maior para o menor

  // Preparar dados para o gráfico de Marcas
  const brandCounts = activeVehicles
    .filter(v => v.status === "Em venda") // Foco no estoque atual para marcas
    .reduce((acc, v) => {
      const brand = v.brand || "Desconhecida";
      acc[brand] = (acc[brand] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const brandData = Object.keys(brandCounts).map(key => ({
    brand: key,
    count: brandCounts[key]
  })).sort((a, b) => b.count - a.count).slice(0, 10); // Top 10 marcas no estoque

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visão Geral</CardTitle>
        <CardDescription>
          Visão geral do gerenciamento da sua ERP Concessionária.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <VehicleKpiCards data={kpis} />
        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3 mt-4">
          <VehicleBrandChart data={brandData} />
          <VehicleStatusChart data={statusData} />
        </div>
      </CardContent>
    </Card>

  )
}
