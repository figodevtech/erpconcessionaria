import { AccessDenied } from "@/components/access-denied";
import { checkPermission } from "@/utils/permissions";
import { VehicleModuleClient } from "./components/vehicle-module-client";

export default async function VeiculosPage() {
  const hasViewPermission = await checkPermission("vehicles:view");
  if (!hasViewPermission) return <AccessDenied />;

  return <VehicleModuleClient />;
}
