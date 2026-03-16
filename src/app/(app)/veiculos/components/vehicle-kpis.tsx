import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CarFront, CheckCircle, Tag, DollarSign } from "lucide-react"

export async function VehicleKPIs() {
  const supabase = await createClient()
  
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("status, price")
    .eq("deleted", false)

  const activeVehicles = vehicles || []
  
  const totalVehicles = activeVehicles.length
  const availableVehicles = activeVehicles.filter(v => v.status === "Em venda")
  const availableCount = availableVehicles.length
  const soldCount = activeVehicles.filter(v => v.status === "Vendido").length
  
  const totalAvailableValue = availableVehicles.reduce((acc, v) => acc + (v.price || 0), 0)
  const averageValue = availableCount > 0 ? totalAvailableValue / availableCount : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total de Veículos
          </CardTitle>
          <CarFront className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalVehicles}</div>
          <p className="text-xs text-muted-foreground">
            Todos cadastrados
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Disponíveis
          </CardTitle>
          <Tag className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{availableCount}</div>
          <p className="text-xs text-muted-foreground">
            Em estoque
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Vendidos
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{soldCount}</div>
          <p className="text-xs text-muted-foreground">
            Status "Vendido"
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Valor Médio
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(averageValue)}
          </div>
          <p className="text-xs text-muted-foreground">
            Dos veículos disponíveis
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
