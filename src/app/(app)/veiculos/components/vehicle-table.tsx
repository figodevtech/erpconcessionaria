"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { type Vehicle } from "./vehicle-list-client";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeftRight, Edit, MoreHorizontal, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function VehicleTable({
  vehicles,
  loading,
  showImages,
  onEdit,
}: {
  vehicles: Vehicle[];
  loading: boolean;
  showImages: boolean;
  onEdit: (vehicle: Vehicle) => void;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Em venda":
        return "bg-blue-500/10 text-blue-500";
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

  return (
    <div className="w-full relative min-h-[400px] p-4">
      <Table className="text-xs">
        <TableHeader>
          <TableRow>
            {showImages && <TableHead>Foto</TableHead>}
            <TableHead>ID</TableHead>
            <TableHead>Marca / Modelo</TableHead>
            <TableHead className="text-center">Ano</TableHead>
            <TableHead className="text-center">Placa</TableHead>
            <TableHead className="text-center">Preço</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-center">Adicionado em</TableHead>
            <TableHead className="text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vehicles.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={showImages ? 9 : 8}
                className="h-24 text-center text-muted-foreground"
              >
                Nenhum veículo encontrado para a busca.
              </TableCell>
            </TableRow>
          ) : (
            vehicles.map((vehicle) => (
              <TableRow
                className="cursor-pointer h-14"
                key={vehicle.id}
                onDoubleClick={() => onEdit(vehicle)}
              >
                {showImages && (
                  <TableCell>
                    <Image
                      src={vehicle.image || ""}
                      alt={vehicle.brand}
                      width={50}
                      height={50}
                      className="rounded-md"
                    />
                  </TableCell>
                )}
                <TableCell>{vehicle.id}</TableCell>
                <TableCell className="font-medium">
                  {vehicle.brand} {vehicle.model} {vehicle.version}
                </TableCell>
                <TableCell className="text-center">{vehicle.year}</TableCell>
                <TableCell className="uppercase text-center">
                  {vehicle.plate || "N/A"}
                </TableCell>
                <TableCell className="text-center">
                  {formatCurrency(vehicle.price)}
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant="outline"
                    className={`font-normal border-transparent ${getStatusColor(vehicle.status || "")}`}
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
                      <DropdownMenuItem className="hover:cursor-pointer bg-blue-600/10 hover:bg-blue-600/20 data-highlighted:bg-blue-600/50 transition-all text-nowrap">
                        <ArrowLeftRight className="mr-2 h-4 w-4" />
                        Transferir
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        className="hover:cursor-pointer"
                        variant="destructive"
                      >
                        <Trash2Icon className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
