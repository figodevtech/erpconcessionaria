import { VehicleKPIs } from "./components/vehicle-kpis"
import { VehicleManager } from "./components/vehicle-manager"
import { checkPermission } from "@/utils/permissions"
import { AccessDenied } from "@/components/access-denied"

export default async function VeiculosPage() {
  const hasViewPermission = await checkPermission("vehicles:view")
  if (!hasViewPermission) return <AccessDenied />

  return (
    <div className="flex flex-col gap-6">
      <VehicleKPIs />
      <VehicleManager />
    </div>
  )
}

