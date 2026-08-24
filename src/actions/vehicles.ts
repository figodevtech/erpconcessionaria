"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";
import { checkPermission } from "@/utils/permissions";
import { isVehicleAvailableStatus, isVehicleStatus, type VehicleStatus } from "@/lib/vehicle-status";

export type VehicleKpisData = {
  totalVehicles: number;
  availableCount: number;
  soldCount: number;
  averageValue: number;
};

export type BulkVehicleStatusResult = {
  requestedCount: number;
  updatedCount: number;
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
  const availableVehicles = activeVehicles.filter((vehicle) => isVehicleAvailableStatus(vehicle.status));
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

export async function updateVehicleStatusesAction(input: {
  vehicleIds: string[];
  status: VehicleStatus;
}): Promise<ActionResult<BulkVehicleStatusResult>> {
  const allowed = await checkPermission("vehicles:update");
  if (!allowed) {
    return { success: false, error: "Você não tem permissão para alterar veículos." };
  }

  if (!Array.isArray(input.vehicleIds) || !isVehicleStatus(input.status)) {
    return { success: false, error: "Dados inválidos para a alteração em massa." };
  }

  const vehicleIds = Array.from(
    new Set(
      input.vehicleIds
        .map((id) => Number(id))
        .filter((id) => Number.isSafeInteger(id) && id > 0),
    ),
  );

  if (vehicleIds.length === 0) {
    return { success: false, error: "Selecione pelo menos um veículo." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Sessão inválida. Entre novamente para continuar." };
  }

  const { data, error } = await supabase
    .from("vehicles")
    .update({
      status: input.status,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .in("id", vehicleIds)
    .eq("deleted", false)
    .select("id");

  if (error) {
    console.error("Error updating vehicle statuses in bulk:", error);
    return { success: false, error: "Não foi possível alterar o status dos veículos." };
  }

  const updatedCount = data?.length ?? 0;
  if (updatedCount === 0) {
    return { success: false, error: "Nenhum veículo pôde ser atualizado." };
  }

  revalidatePath("/veiculos");
  revalidatePath("/dashboard");

  return {
    success: true,
    data: {
      requestedCount: vehicleIds.length,
      updatedCount,
    },
  };
}
