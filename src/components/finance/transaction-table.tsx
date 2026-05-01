"use client";

import { useState, useTransition } from "react";
import { ArrowDownCircle, ArrowUpCircle, Download, Eye, MoreHorizontal, Paperclip, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getTransactionAttachmentUrlAction, softDeleteTransactionAction } from "@/actions/transactions";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { formatFileSize } from "@/lib/documents";
import { formatCpfCnpj } from "@/lib/customers";
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
  const [detailsTransaction, setDetailsTransaction] = useState<Transaction | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [isPending, startTransition] = useTransition();
  const canDelete = hasPermission("finance:delete");

  function handleDelete() {
    if (!transactionToDelete) return;

    setDeletingId(transactionToDelete.id);
    startTransition(async () => {
      const result = await softDeleteTransactionAction(transactionToDelete.id);
      if (result.success) {
        toast.success("Transação removida");
        setTransactionToDelete(null);
        onChanged();
      } else {
        toast.error(result.error ?? "Erro ao remover transação");
      }
      setDeletingId(null);
    });
  }

  async function openAttachment(attachmentId: number) {
    const result = await getTransactionAttachmentUrlAction(attachmentId);
    if (result.success && result.data) {
      window.open(result.data, "_blank", "noopener,noreferrer");
    } else {
      toast.error(result.error ?? "Erro ao abrir comprovante");
    }
  }

  return (
    <div className="w-full">
      <ScrollArea className="w-full">
        <div className="min-w-full rounded-md border bg-background">
          <Table className="min-w-[1200px] text-xs">
        <TableHeader>
          <TableRow>
            <TableHead>Descrição</TableHead>
            {!compact && <TableHead>Veículo</TableHead>}
            <TableHead>Categoria</TableHead>
            <TableHead>Método</TableHead>
            <TableHead className="text-center">Data</TableHead>
            <TableHead className="text-center">Tipo</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={compact ? 8 : 9} className="h-24 text-center text-muted-foreground">
                {loading ? "Carregando transações..." : "Nenhuma transação encontrada."}
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction) => {
              const isReceita = transaction.tipo === "RECEITA";
              const attachment = transaction.attachments?.[0];
              return (
                <TableRow key={transaction.id}>
                  <TableCell className="max-w-[260px] font-medium">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <div className="truncate">{transaction.descricao}</div>
                      {attachment && (
                        <Paperclip className="h-3.5 w-3.5 shrink-0 text-primary" />
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {transaction.customer?.name || transaction.nome_pagador}
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
                        <DropdownMenuItem onClick={() => setDetailsTransaction(transaction)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Detalhes
                        </DropdownMenuItem>
                        {attachment && (
                          <DropdownMenuItem
                            onClick={() => openAttachment(attachment.id)}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Anexo
                          </DropdownMenuItem>
                        )}
                        {canDelete ? (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setTransactionToDelete(transaction)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remover
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem disabled>Sem permissões</DropdownMenuItem>
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
      </div>
      <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <TransactionDetailsDialog
        transaction={detailsTransaction}
        onOpenChange={(open) => !open && setDetailsTransaction(null)}
        onOpenAttachment={openAttachment}
      />

      <AlertDialog
        open={!!transactionToDelete}
        onOpenChange={(open) => !open && setTransactionToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir transação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove o lançamento{" "}
              <strong>{transactionToDelete?.descricao}</strong> do fluxo de caixa. O registro será
              marcado como excluído e deixará de aparecer nas listagens.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isPending}
              onClick={handleDelete}
            >
              {isPending ? "Excluindo..." : "Sim, excluir transação"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TransactionDetailsDialog({
  transaction,
  onOpenChange,
  onOpenAttachment,
}: {
  transaction: Transaction | null;
  onOpenChange: (open: boolean) => void;
  onOpenAttachment: (attachmentId: number) => void;
}) {
  if (!transaction) return null;

  const isReceita = transaction.tipo === "RECEITA";
  const attachment = transaction.attachments?.[0];
  const vehicleLabel = transaction.vehicle
    ? `${transaction.vehicle.brand ?? ""} ${transaction.vehicle.model ?? ""}${transaction.vehicle.plate ? ` - ${transaction.vehicle.plate}` : ""}`.trim()
    : "-";

  return (
    <Dialog open={!!transaction} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Detalhes da transação</DialogTitle>
          <DialogDescription>
            Consulta completa do lançamento financeiro registrado.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 md:grid-cols-2">
          <DetailItem label="Descrição" value={transaction.descricao} className="md:col-span-2" />
          <DetailItem label="Tipo" value={transactionTypeLabel(transaction.tipo)} />
          <DetailItem
            label="Valor"
            value={`${isReceita ? "+" : "-"} ${formatCurrency(transaction.valor)}`}
            valueClassName={isReceita ? "text-emerald-600" : "text-red-600"}
          />
          <DetailItem label="Status" value={transaction.pendente ? "Pendente" : "Liquidado"} />
          <DetailItem label="Data" value={new Date(transaction.data).toLocaleString("pt-BR")} />
          <DetailItem label="Categoria" value={transaction.category?.nome || transaction.categoria} />
          <DetailItem label="Método" value={transaction.payment_method?.nome || paymentMethodLabel(transaction.metodo_pagamento)} />
          <DetailItem label="Banco / Conta" value={transaction.bank_account?.titulo || "-"} />
          <DetailItem label="Veículo" value={vehicleLabel} />
          <DetailItem label="Nome do pagador" value={transaction.nome_pagador} />
          <DetailItem label="Cliente vinculado" value={transaction.customer?.name || "-"} />
          <DetailItem label="CPF/CNPJ do pagador" value={formatCpfCnpj(transaction.customer?.cpf_cnpj || transaction.cpf_cnpj_pagador)} />
          <DetailItem label="Valor liquido" value={transaction.valor_liquido == null ? "-" : formatCurrency(transaction.valor_liquido)} />
          <DetailItem label="Criada em" value={new Date(transaction.created_at).toLocaleString("pt-BR")} />
        </div>

        <div className="rounded-xl border bg-muted/20 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Paperclip className="h-4 w-4 text-primary" />
            Comprovante
          </div>
          {attachment ? (
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{attachment.file_name}</div>
                <div className="text-xs text-muted-foreground">
                  {formatFileSize(attachment.file_size)} {attachment.mime_type ? `- ${attachment.mime_type}` : ""}
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenAttachment(attachment.id)}>
                <Download className="mr-2 h-4 w-4" />
                Anexo
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum comprovante anexado.</p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailItem({
  label,
  value,
  className,
  valueClassName,
}: {
  label: string;
  value: string;
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={className}>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-1 break-words text-sm font-medium ${valueClassName ?? ""}`}>{value || "-"}</div>
    </div>
  );
}
