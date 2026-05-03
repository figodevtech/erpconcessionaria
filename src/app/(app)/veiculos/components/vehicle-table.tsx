"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Edit, MoreHorizontal, Trash2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export function VehicleTable({
  vehicles,
  loading,
  showImages,
  onEdit,
  onDeleteSuccess,
}: {
  vehicles: Vehicle[];
  loading: boolean;
  showImages: boolean;
  onEdit: (vehicle: Vehicle) => void;
  onDeleteSuccess: () => void;
}) {
  const { hasPermission } = usePermissions();
  const [isDeleting, setIsDeleting] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Em venda":
        return "bg-blue-500/10 text-blue-500";
      case "Em breve":
        return "bg-purple-500/10 text-purple-500";
      case "Vendido":
        return "bg-green-500/10 text-green-500";
      case "Rascunho":
        return "bg-orange-500/10 text-orange-500";
      case "Pagamento":
        return "bg-yellow-500/10 text-yellow-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

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
    Number(value ?? 0) >= 0 ? "text-emerald-600" : "text-red-600";

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
    <div className="relative min-h-[400px] w-full">
      <ScrollArea className="w-full">
        <div className="min-w-full p-4">
          <Table className=" text-xs">
            <TableHeader>
              <TableRow>
                {showImages && <TableHead>Foto</TableHead>}
                <TableHead>ID</TableHead>
                <TableHead>Marca / Modelo</TableHead>
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
                    colSpan={showImages ? 14 : 13}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {loading ? "Carregando veiculos..." : "Nenhum veiculo encontrado para a busca."}
                  </TableCell>
                </TableRow>
              ) : (
                vehicles.map((vehicle) => (
                  <TableRow
                    className="h-14 cursor-pointer"
                    key={vehicle.id}
                    onDoubleClick={() => onEdit(vehicle)}
                  >
                    {showImages && (
                      <TableCell>
                        <Image
                          src={vehicle.image || ""}
                          alt={vehicle.brand}
                          width={70}
                          height={70}
                          className="rounded-md"
                        />
                      </TableCell>
                    )}
                    <TableCell>{vehicle.id}</TableCell>
                    <TableCell className="min-w-[240px] font-medium">
                      {vehicle.brand} {vehicle.model} {vehicle.version}
                    </TableCell>
                    <TableCell className="text-center">{vehicle.year}</TableCell>
                    <TableCell className="text-center uppercase">
                      {vehicle.plate || "N/A"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(Number(vehicle.purchase_price ?? 0))}
                    </TableCell>
                    <TableCell className="text-right font-medium text-emerald-600">
                      {formatCurrency(Number(vehicle.total_receitas ?? 0))}
                    </TableCell>
                    <TableCell className="text-right font-medium text-red-600">
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
                      <Badge
                        variant="outline"
                        className={`border-transparent font-normal ${getStatusColor(vehicle.status || "")}`}
                      >
                        {vehicle.status || "Indefinido"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {new Date(vehicle.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
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
