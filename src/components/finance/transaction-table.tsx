"use client";

import { useState, useTransition } from "react";
import { ArrowDownCircle, ArrowUpCircle, MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { softDeleteTransactionAction } from "@/actions/transactions";
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
import { formatCurrency } from "@/lib/utils";
import {
  paymentMethodLabel,
  transactionTypeLabel,
  type Transaction,
} from "@/lib/transactions";
import { usePermissions } from "@/hooks/use-permissions";

type TransactionTableProps = {
  transactions: Transaction[];
  loading?: boolean;
  onChanged: () => void;
  compact?: boolean;
};

export function TransactionTable({
  transactions,
  loading = false,
  onChanged,
  compact = false,
}: TransactionTableProps) {
  const { hasPermission } = usePermissions();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [isPending, startTransition] = useTransition();
  const canDelete = hasPermission("finance:delete");

  function handleDelete() {
    if (!transactionToDelete) return;

    setDeletingId(transactionToDelete.id);
    startTransition(async () => {
      const result = await softDeleteTransactionAction(transactionToDelete.id);
      if (result.success) {
        toast.success("Transacao removida");
        setTransactionToDelete(null);
        onChanged();
      } else {
        toast.error(result.error ?? "Erro ao remover transacao");
      }
      setDeletingId(null);
    });
  }

  return (
    <div className="w-full overflow-hidden rounded-md border bg-background">
      <Table className="text-xs">
        <TableHeader>
          <TableRow>
            <TableHead>Descricao</TableHead>
            {!compact && <TableHead>Veiculo</TableHead>}
            <TableHead>Categoria</TableHead>
            <TableHead>Metodo</TableHead>
            <TableHead className="text-center">Data</TableHead>
            <TableHead className="text-center">Tipo</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-center">Acoes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={compact ? 8 : 9} className="h-24 text-center text-muted-foreground">
                {loading ? "Carregando transacoes..." : "Nenhuma transacao encontrada."}
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction) => {
              const isReceita = transaction.tipo === "RECEITA";
              return (
                <TableRow key={transaction.id}>
                  <TableCell className="max-w-[260px] font-medium">
                    <div className="truncate">{transaction.descricao}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {transaction.nome_pagador}
                    </div>
                  </TableCell>
                  {!compact && (
                    <TableCell>
                      {transaction.vehicle ? (
                        <span className="text-nowrap">
                          {transaction.vehicle.brand} {transaction.vehicle.model}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell>{transaction.category?.nome || transaction.categoria}</TableCell>
                  <TableCell>{transaction.payment_method?.nome || paymentMethodLabel(transaction.metodo_pagamento)}</TableCell>
                  <TableCell className="text-center">
                    {new Date(transaction.data).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={`border-transparent ${isReceita ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}
                    >
                      {isReceita ? (
                        <ArrowUpCircle className="mr-1 h-3 w-3" />
                      ) : (
                        <ArrowDownCircle className="mr-1 h-3 w-3" />
                      )}
                      {transactionTypeLabel(transaction.tipo)}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right font-semibold ${isReceita ? "text-emerald-600" : "text-red-600"}`}>
                    {isReceita ? "+" : "-"} {formatCurrency(transaction.valor)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={transaction.pendente ? "outline" : "secondary"} className="font-normal">
                      {transaction.pendente ? "Pendente" : "Liquidado"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon" disabled={isPending && deletingId === transaction.id}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        {canDelete ? (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setTransactionToDelete(transaction)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remover
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem disabled>Sem permissoes</DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>

      <AlertDialog
        open={!!transactionToDelete}
        onOpenChange={(open) => !open && setTransactionToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir transacao?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao remove o lancamento{" "}
              <strong>{transactionToDelete?.descricao}</strong> do fluxo de caixa. O registro sera
              marcado como excluido e deixara de aparecer nas listagens.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isPending}
              onClick={handleDelete}
            >
              {isPending ? "Excluindo..." : "Sim, excluir transacao"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
