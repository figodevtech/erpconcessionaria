"use server";

import { createClient } from "@/utils/supabase/server";
import { checkPermission } from "@/utils/permissions";

export type VehicleKpisData = {
  totalVehicles: number;
  availableCount: number;
  soldCount: number;
  averageValue: number;
};

type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function getVehicleKpisAction(): Promise<ActionResult<VehicleKpisData>> {
  const allowed = await checkPermission("vehicles:view");
  if (!allowed) return { success: false, error: "Voce nao tem permissao para visualizar veiculos." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("status, price")
    .eq("deleted", false);

  if (error) return { success: false, error: error.message };

  const activeVehicles = data || [];
  const availableVehicles = activeVehicles.filter((vehicle) => vehicle.status === "Em venda");
  const availableCount = availableVehicles.length;
  const totalAvailableValue = availableVehicles.reduce((acc, vehicle) => acc + Number(vehicle.price || 0), 0);

  return {
    success: true,
    data: {
      totalVehicles: activeVehicles.length,
      availableCount,
      soldCount: activeVehicles.filter((vehicle) => vehicle.status === "Vendido").length,
      averageValue: availableCount > 0 ? totalAvailableValue / availableCount : 0,
    },
  };
}
