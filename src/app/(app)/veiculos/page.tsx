import { VehicleKPIs } from "./components/vehicle-kpis"
import { VehicleManager } from "./components/vehicle-manager"

export default function VeiculosPage() {
  return (
    <div className="flex flex-col gap-6">
      <VehicleKPIs />
      <VehicleManager />
    </div>
  )
}

