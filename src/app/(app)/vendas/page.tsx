import { AccessDenied } from "@/components/access-denied";
import { checkPermission } from "@/utils/permissions";
import { SalesModuleClient } from "./components/sales-module-client";

export default async function SalesPage() {
  // Using sales:view or falling back to vehicles:view since sales are tightly coupled
  // but ideally it's sales:view mapped in the DB.
  const hasViewPermission = await checkPermission("sales:view");
  if (!hasViewPermission) {
    const hasVehiclePermission = await checkPermission("vehicles:view");
    if (!hasVehiclePermission) return <AccessDenied />;
  }

  return <SalesModuleClient />;
}
