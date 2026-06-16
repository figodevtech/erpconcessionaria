export const VEHICLE_AVAILABLE_STATUSES = ["Em venda", "Repasse"] as const;

export const VEHICLE_STATUSES = [
  "Em venda",
  "Repasse",
  "Em breve",
  "Vendido",
  "Rascunho",
  "Pagamento",
] as const;

export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export function isVehicleAvailableStatus(status?: string | null) {
  return VEHICLE_AVAILABLE_STATUSES.includes(status as (typeof VEHICLE_AVAILABLE_STATUSES)[number]);
}
