"use client";

import { useState, useTransition } from "react";
import { Building2, Edit, IdCard, MoreHorizontal, Phone, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { deleteCustomerAction } from "@/actions/customers";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { usePermissions } from "@/hooks/use-permissions";
import {
  customerPersonTypeLabel,
  customerRankLabel,
  customerStatusLabel,
  formatCpfCnpj,
  formatPhone,
  type Customer,
} from "@/lib/customers";
import { VehiclePagination } from "@/app/(app)/veiculos/components/vehicle-pagination";
import { CustomerDialog } from "./customer-dialog";

type CustomerTableProps = {
  customers: Customer[];
  loading: boolean;
  onSuccess: () => void;
  page: number;
  setPage: (page: number) => void;
  count: number;
  pageSize: number;
};

export function CustomerTable({
  customers,
  loading,
  onSuccess,
  page,
  setPage,
  count,
  pageSize,
}: CustomerTableProps) {
  const { hasPermission } = usePermissions();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [isPending, startTransition] = useTransition();

  const canUpdate = hasPermission("customers:update");
  const canDelete = hasPermission("customers:delete");
  const totalPages = Math.ceil(count / pageSize);

  function handleDelete() {
    if (!deleteTarget) return;

    startTransition(async () => {
      const result = await deleteCustomerAction(deleteTarget.id);
      if (result.success) {
        toast.success("Cliente excluído");
        setDeleteTarget(null);
        onSuccess();
      } else {
        toast.error(result.error ?? "Erro ao excluir cliente");
      }
    });
  }

  return (
    <div className="space-y-6">
      <Table className="text-xs">
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-transparent">
            <TableHead className="w-[72px]">Tipo</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Documento</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Cidade/UF</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-center">Classificação</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                {loading ? "Carregando clientes..." : "Nenhum cliente encontrado."}
              </TableCell>
            </TableRow>
          ) : (
            customers.map((customer) => (
              <TableRow
                key={customer.id}
                className="h-14 cursor-pointer transition-colors hover:bg-muted/50"
                onDoubleClick={() => canUpdate && setSelectedCustomer(customer)}
              >
                <TableCell>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {customer.person_type === "PF" ? <UserRound className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
                  </div>
                </TableCell>
                <TableCell className="max-w-[280px]">
                  <div className="truncate text-sm font-semibold">{customer.name}</div>
                  <div className="text-[11px] text-muted-foreground">{customer.email}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <IdCard className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{formatCpfCnpj(customer.cpf_cnpj)}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">{customerPersonTypeLabel(customer.person_type)}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{formatPhone(customer.phone)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {customer.city}/{customer.state}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={customer.status === "ATIVO" ? "secondary" : "outline"} className="font-normal">
                    {customerStatusLabel(customer.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="font-normal">
                    {customerRankLabel(customer.rank)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end">
                      {canUpdate && (
                        <DropdownMenuItem onClick={() => setSelectedCustomer(customer)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                      )}
                      {canDelete && (
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarget(customer)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
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

      {totalPages > 1 && (
        <VehiclePagination page={page} totalPages={totalPages} setPage={setPage} />
      )}

      <CustomerDialog
        open={!!selectedCustomer}
        onOpenChange={(open) => !open && setSelectedCustomer(null)}
        customer={selectedCustomer}
        onSuccess={onSuccess}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove <strong>{deleteTarget?.name}</strong> da lista de clientes ativos. O cadastro será preservado como excluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending} className="mr-2">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isPending}
              onClick={(event) => {
                event.preventDefault();
                handleDelete();
              }}
            >
              {isPending ? "Excluindo..." : "Sim, excluir cliente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
