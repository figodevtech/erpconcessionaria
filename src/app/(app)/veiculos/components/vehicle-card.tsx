import Image from "next/image";
import {
  MapPin,
  Fuel,
  Gauge,
  Calendar,
  Star,
  CreditCardIcon,
  Edit,
  Trash2,
  Ellipsis,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Vehicle } from "./vehicle-list-client";
import { formatMileage, formatPrice } from "@/lib/vehicles";
import { useState } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VehicleStatusBadge } from "./vehicle-status-badge";

interface VehicleCardProps {
  vehicle: Vehicle;
  priority?: boolean;
  onEdit?: (vehicle: Vehicle) => void;
  onDeleteSuccess?: () => void;
}

export function VehicleCard({
  vehicle,
  priority,
  onEdit,
  onDeleteSuccess,
}: VehicleCardProps) {
  const { hasPermission } = usePermissions();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/vehicles?id=${vehicle.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Erro ao excluir veículo");
      }

      toast.success("Veículo excluído com sucesso!");
      onDeleteSuccess?.();
    } catch (error: unknown) {
      console.error("Error deleting vehicle:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao excluir veículo");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <Card
        className="vehicle-card group h-full cursor-pointer gap-0 overflow-hidden p-0"
        onDoubleClick={() => onEdit?.(vehicle)}
      >
        <div className="relative aspect-[16/10] shrink-0 overflow-hidden bg-muted">
          <Image
            src={vehicle.image}
            alt={`${vehicle.brand} ${vehicle.model} ${vehicle.version}`}
            fill
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.025]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={priority}
          />

          <div className="absolute right-2.5 top-2.5">
            <Badge
              variant="secondary"
              className="bg-card/90 text-[10px] text-card-foreground shadow-sm backdrop-blur-md"
            >
              {vehicle.seller_type === "dealership"
                ? "Concessionaria"
                : vehicle.seller_type === "store"
                  ? "Loja"
                  : "Particular"}
            </Badge>
          </div>
          {vehicle.featured && (
            <div className="absolute left-2.5 top-2.5">
              <Badge
                variant="secondary"
                className="bg-fuchsia-700/85 text-[10px] text-white shadow-sm backdrop-blur-md"
              >
                <Star className="size-3 shrink-0" /> Destaque
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="flex flex-grow flex-col p-3.5 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <VehicleStatusBadge status={vehicle.status} />
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={(event) => event.stopPropagation()}
                aria-label="Ações do veículo"
              >
                <Ellipsis className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px]">
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={(event) => {
                    event.stopPropagation();
                    onEdit?.(vehicle);
                  }}
                >
                  <Edit className="mr-2 size-4" />
                  Editar
                </DropdownMenuItem>
                {hasPermission("vehicles:delete") && (
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={(event) => {
                      event.stopPropagation();
                      setShowDeleteDialog(true);
                    }}
                  >
                    <Trash2 className="mr-2 size-4" />
                    Excluir
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="mb-1.5 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary/80">
              {vehicle.brand}
            </p>
            <h3 className="truncate text-base font-semibold tracking-tight text-card-foreground">
              {vehicle.model}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                {vehicle.version}
              </span>
            </h3>
          </div>

          <p className="mb-4 text-lg font-semibold tracking-tight sm:text-xl">
            {formatPrice(vehicle.price)}
          </p>

          <div className="grid grid-cols-2 gap-x-2 gap-y-2.5 text-[11px] sm:text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CreditCardIcon className="size-3.5 shrink-0 text-primary/70" />
              <span>{vehicle.plate}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="size-3.5 shrink-0 text-primary/70" />
              <span>
                {vehicle.year}/{vehicle.year_model}
              </span>
            </div>
            {vehicle.mileage && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Gauge className="size-3.5 shrink-0 text-primary/70" />
                <span>{formatMileage(vehicle.mileage)}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Fuel className="size-3.5 shrink-0 text-primary/70" />
              <span>{vehicle.fuel}</span>
            </div>
            <div className="col-span-2 flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="size-3.5 shrink-0 text-primary/70" />
              <span className="truncate">
                {vehicle.city} - {vehicle.state}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação excluirá o veículo{" "}
              <strong>
                {vehicle.brand} {vehicle.model}
              </strong>{" "}
              permanentemente do marketplace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel
              className="mr-2"
              disabled={isDeleting}
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? "Excluindo..." : "Sim, excluir veículo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
