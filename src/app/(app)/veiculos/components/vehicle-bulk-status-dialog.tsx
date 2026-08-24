"use client";

import { useState } from "react";
import { Loader2, Tags } from "lucide-react";
import { toast } from "sonner";

import { updateVehicleStatusesAction } from "@/actions/vehicles";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isVehicleStatus, VEHICLE_STATUSES, type VehicleStatus } from "@/lib/vehicle-status";

type VehicleBulkStatusDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedVehicleIds: string[];
  onSuccess: () => void;
};

export function VehicleBulkStatusDialog({
  open,
  onOpenChange,
  selectedVehicleIds,
  onSuccess,
}: VehicleBulkStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<VehicleStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSubmitting) return;
    if (!nextOpen) setSelectedStatus(null);
    onOpenChange(nextOpen);
  };

  const handleConfirm = async () => {
    if (!selectedStatus || selectedVehicleIds.length === 0) return;

    setIsSubmitting(true);
    try {
      const result = await updateVehicleStatusesAction({
        vehicleIds: selectedVehicleIds,
        status: selectedStatus,
      });

      if (!result.success || !result.data) {
        toast.error(result.error || "Não foi possível alterar os veículos.");
        return;
      }

      if (result.data.updatedCount < result.data.requestedCount) {
        toast.warning(
          `${result.data.updatedCount} de ${result.data.requestedCount} veículos foram atualizados.`,
        );
      } else {
        toast.success(
          `Status alterado em ${result.data.updatedCount} ${result.data.updatedCount === 1 ? "veículo" : "veículos"}.`,
        );
      }

      setSelectedStatus(null);
      onOpenChange(false);
      onSuccess();
    } catch (error: unknown) {
      console.error("Error running bulk vehicle status action:", error);
      toast.error("Não foi possível alterar o status dos veículos.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Tags className="size-4" />
            </span>
            <div className="min-w-0">
              <DialogTitle>Alterar status em massa</DialogTitle>
              <DialogDescription className="mt-1">
                Defina o novo status dos {selectedVehicleIds.length} veículos selecionados.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <label htmlFor="bulk-vehicle-status" className="text-xs font-medium text-foreground">
            Novo status
          </label>
          <Select
            value={selectedStatus}
            onValueChange={(value) => {
              if (isVehicleStatus(value)) setSelectedStatus(value);
            }}
            disabled={isSubmitting}
          >
            <SelectTrigger id="bulk-vehicle-status" className="w-full">
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              {VEHICLE_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedStatus || selectedVehicleIds.length === 0 || isSubmitting}
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Confirmar alteração
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
