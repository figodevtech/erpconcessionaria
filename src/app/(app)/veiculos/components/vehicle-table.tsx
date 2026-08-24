"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { CarFront, Edit, MoreHorizontal, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { usePermissions } from "@/hooks/use-permissions";
import { type Vehicle } from "./vehicle-list-client";
import { VehicleStatusBadge } from "./vehicle-status-badge";

export function VehicleTable({
  vehicles,
  loading,
  showImages,
  bulkMode,
  selectedVehicleIds,
  allVisibleSelected,
  someVisibleSelected,
  onToggleVehicle,
  onToggleVisible,
  onEdit,
  onDeleteSuccess,
}: {
  vehicles: Vehicle[];
  loading: boolean;
  showImages: boolean;
  bulkMode: boolean;
  selectedVehicleIds: ReadonlySet<string>;
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
  onToggleVehicle: (vehicleId: string, checked: boolean) => void;
  onToggleVisible: (checked: boolean) => void;
  onEdit: (vehicle: Vehicle) => void;
  onDeleteSuccess: () => void;
}) {
  const { hasPermission } = usePermissions();
  const [isDeleting, setIsDeleting] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);
  };

  const formatPercent = (value?: number) => {
    return `${Number(value ?? 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}%`;
  };

  const profitClassName = (value?: number) =>
    Number(value ?? 0) >= 0
      ? "text-emerald-700 dark:text-emerald-400"
      : "text-red-700 dark:text-red-400";

  const handleDelete = async (id: number) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/vehicles?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Erro ao excluir veiculo");
      }

      toast.success("Veiculo excluido com sucesso!");
      onDeleteSuccess();
    } catch (error: unknown) {
      console.error("Error deleting vehicle:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao excluir veiculo");
    } finally {
      setIsDeleting(false);
      setVehicleToDelete(null);
    }
  };

  return (
    <div className="relative min-h-[320px] w-full">
      <ScrollArea className="w-full">
        <div className={bulkMode ? "min-w-[1368px]" : "min-w-[1320px]"}>
          <Table className="text-xs">
            <TableHeader className="bg-muted/55">
              <TableRow>
                {bulkMode ? (
                  <TableHead className="w-12 pl-4">
                    <Checkbox
                      className="cursor-pointer"
                      checked={allVisibleSelected}
                      indeterminate={someVisibleSelected}
                      disabled={loading || vehicles.length === 0}
                      onCheckedChange={(checked) => onToggleVisible(Boolean(checked))}
                      aria-label="Selecionar todos os veículos desta página"
                    />
                  </TableHead>
                ) : null}
                {showImages && <TableHead className={bulkMode ? "" : "pl-4"}>Foto</TableHead>}
                <TableHead className={showImages || bulkMode ? "" : "pl-4"}>ID</TableHead>
                <TableHead className="min-w-[240px]">Marca / Modelo</TableHead>
                <TableHead className="text-center">Ano</TableHead>
                <TableHead className="text-center">Placa</TableHead>
                <TableHead className="text-right">Valor Compra</TableHead>
                <TableHead className="text-right">Receitas Ops.</TableHead>
                <TableHead className="text-right">Despesas Ops.</TableHead>
                <TableHead className="text-right">Valor Venda</TableHead>
                <TableHead className="text-right">Lucro</TableHead>
                <TableHead className="text-right">% Lucro</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Adicionado em</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={13 + (showImages ? 1 : 0) + (bulkMode ? 1 : 0)}
                    className="h-64 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-3">
                      {loading ? (
                        <span className="size-5 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
                      ) : (
                        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <CarFront className="size-5" />
                        </span>
                      )}
                      <span>{loading ? "Carregando veiculos..." : "Nenhum veiculo encontrado para a busca."}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                vehicles.map((vehicle) => (
                  <TableRow
                    className={`h-13 transition-colors hover:bg-primary/[0.035] dark:hover:bg-primary/[0.06] ${bulkMode ? "cursor-default" : "cursor-pointer"} ${selectedVehicleIds.has(vehicle.id) ? "bg-primary/[0.055] dark:bg-primary/[0.09]" : ""}`}
                    key={vehicle.id}
                    data-state={selectedVehicleIds.has(vehicle.id) ? "selected" : undefined}
                    onDoubleClick={bulkMode ? undefined : () => onEdit(vehicle)}
                  >
                    {bulkMode ? (
                      <TableCell className="pl-4">
                        <Checkbox
                          className="cursor-pointer"
                          checked={selectedVehicleIds.has(vehicle.id)}
                          onCheckedChange={(checked) => onToggleVehicle(vehicle.id, Boolean(checked))}
                          aria-label={`Selecionar ${vehicle.brand} ${vehicle.model}`}
                        />
                      </TableCell>
                    ) : null}
                    {showImages && (
                      <TableCell className={bulkMode ? "" : "pl-4"}>
                        <Image
                          src={vehicle.image || ""}
                          alt={vehicle.brand}
                          width={48}
                          height={48}
                          className="size-12 rounded-lg border border-border/70 object-cover"
                        />
                      </TableCell>
                    )}
                    <TableCell className={showImages || bulkMode ? "text-muted-foreground" : "pl-4 text-muted-foreground"}>
                      {vehicle.id}
                    </TableCell>
                    <TableCell className="min-w-[240px]">
                      <span className="font-semibold text-foreground">{vehicle.brand} {vehicle.model}</span>{" "}
                      <span className="text-muted-foreground">{vehicle.version}</span>
                    </TableCell>
                    <TableCell className="text-center">{vehicle.year}</TableCell>
                    <TableCell className="text-center uppercase">
                      {vehicle.plate || "N/A"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(Number(vehicle.purchase_price ?? 0))}
                    </TableCell>
                    <TableCell className="text-right font-medium text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(Number(vehicle.total_receitas ?? 0))}
                    </TableCell>
                    <TableCell className="text-right font-medium text-red-700 dark:text-red-400">
                      {formatCurrency(Number(vehicle.total_despesas ?? 0))}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {formatCurrency(vehicle.price)}
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${profitClassName(vehicle.lucro)}`}>
                      {formatCurrency(Number(vehicle.lucro ?? 0))}
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${profitClassName(vehicle.lucro)}`}>
                      {formatPercent(vehicle.lucro_percentual)}
                    </TableCell>
                    <TableCell className="text-center">
                      <VehicleStatusBadge status={vehicle.status} />
                    </TableCell>
                    <TableCell className="text-center">
                      {new Date(vehicle.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="size-4" />
                              <span className="sr-only">Ações do veículo</span>
                            </Button>
                          }
                        />

                        <DropdownMenuContent align="end" className="text-nowrap">
                          <DropdownMenuItem
                            className="hover:cursor-pointer"
                            onClick={() => onEdit(vehicle)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>

                          {hasPermission("vehicles:delete") && (
                            <DropdownMenuItem
                              className="text-destructive hover:cursor-pointer focus:text-destructive"
                              onClick={() => setVehicleToDelete(vehicle)}
                            >
                              <Trash2Icon className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <AlertDialog
        open={!!vehicleToDelete}
        onOpenChange={(open) => !open && setVehicleToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Voce tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao excluira o veiculo{" "}
              <strong>{vehicleToDelete?.brand} {vehicleToDelete?.model}</strong>{" "}
              permanentemente do marketplace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel
              className="mr-2"
              disabled={isDeleting}
              onClick={() => setVehicleToDelete(null)}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground transition-colors hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={() => vehicleToDelete && handleDelete(Number(vehicleToDelete.id))}
            >
              {isDeleting ? "Excluindo..." : "Sim, excluir veiculo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
