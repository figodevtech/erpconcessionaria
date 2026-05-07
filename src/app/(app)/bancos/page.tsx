"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Building2,
  Edit,
  Loader2,
  Plus,
  Search,
  Trash2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { listBankAccountsDashboardAction } from "@/actions/banks";
import {
  deleteBankAccountAction,
  updateBankAccountStatusAction,
} from "@/actions/type-catalog";
import { listTransactionsAction } from "@/actions/transactions";
import { TypeCreateDialog, type TypeEditTarget } from "@/app/(app)/tipos/components/type-create-dialog";
import { VehiclePagination } from "@/app/(app)/veiculos/components/vehicle-pagination";
import { AccessDenied } from "@/components/access-denied";
import { TransactionDialog } from "@/components/finance/transaction-dialog";
import { TransactionTable } from "@/components/finance/transaction-table";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePermissions } from "@/hooks/use-permissions";
import type { BankAccountSummary, BankDashboardKpis } from "@/lib/banks";
import { bankAccountTypeLabel } from "@/lib/type-catalog";
import type { Transaction } from "@/lib/transactions";
import { formatCurrency } from "@/lib/utils";

const pageSize = 8;

export default function BanksPage() {
  const { hasPermission } = usePermissions();
  const [banks, setBanks] = useState<BankAccountSummary[]>([]);
  const [kpis, setKpis] = useState<BankDashboardKpis | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionCount, setTransactionCount] = useState(0);
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"TODOS" | "ATIVO" | "INATIVO">("TODOS");
  const [page, setPage] = useState(1);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [bankDialogTarget, setBankDialogTarget] = useState<TypeEditTarget>(null);
  const [bankDialogOpen, setBankDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);

  const canView = hasPermission("finance:view");
  const canCreateBank = hasPermission("types:create");
  const canUpdateBank = hasPermission("types:update");
  const canDeleteBank = hasPermission("types:delete");
  const canCreateTransaction = hasPermission("finance:create");

  const fetchBanks = useCallback(async () => {
    setLoadingBanks(true);
    const result = await listBankAccountsDashboardAction({ search, status });

    if (result.success && result.data) {
      setBanks(result.data.banks);
      setKpis(result.data.kpis);
      setSelectedBankId((current) => {
        if (current && result.data!.banks.some((bank) => bank.id === current)) return current;
        return result.data!.banks[0]?.id ?? null;
      });
    } else {
      toast.error(result.error ?? "Erro ao carregar bancos");
    }

    setLoadingBanks(false);
  }, [search, status]);

  const fetchTransactions = useCallback(async () => {
    if (!selectedBankId) {
      setTransactions([]);
      setTransactionCount(0);
      return;
    }

    setLoadingTransactions(true);
    const result = await listTransactionsAction({
      page,
      pageSize,
      bankId: selectedBankId,
    });

    if (result.success) {
      setTransactions(result.data ?? []);
      setTransactionCount(result.count ?? 0);
    } else {
      toast.error(result.error ?? "Erro ao carregar transacoes");
    }

    setLoadingTransactions(false);
  }, [page, selectedBankId]);

  useEffect(() => {
    if (!canView) return;
    const timeout = setTimeout(fetchBanks, 200);
    return () => clearTimeout(timeout);
  }, [canView, fetchBanks]);

  useEffect(() => {
    if (!canView) return;
    const timeout = setTimeout(fetchTransactions, 0);
    return () => clearTimeout(timeout);
  }, [canView, fetchTransactions]);

  if (!canView) return <AccessDenied />;

  const selectedBank = banks.find((bank) => bank.id === selectedBankId) ?? null;
  const totalPages = Math.max(1, Math.ceil(transactionCount / pageSize));

  function refreshAll() {
    fetchBanks();
    fetchTransactions();
  }

  return (
    <div className="flex flex-col gap-6">
      {kpis ? <BankKpis data={kpis} /> : <BankKpisSkeleton />}

      <Card>
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <CardTitle>Bancos e contas</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Acompanhe saldos por conta e os movimentos financeiros vinculados.
              </p>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative min-w-[260px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar banco, agencia ou proprietario..."
                  className="pl-9"
                />
              </div>
              <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value="ATIVO">Ativos</SelectItem>
                  <SelectItem value="INATIVO">Inativos</SelectItem>
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" onClick={refreshAll} disabled={loadingBanks}>
                <Loader2 className={`mr-2 h-4 w-4 ${loadingBanks ? "animate-spin" : ""}`} />
                Recarregar
              </Button>
              {canCreateBank && (
                <Button
                  type="button"
                  onClick={() => {
                    setBankDialogTarget(null);
                    setBankDialogOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Novo banco
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loadingBanks ? (
            <div className="p-4">
              <Skeleton className="h-[320px] w-full" />
            </div>
          ) : (
            <BankTable
              banks={banks}
              selectedBankId={selectedBankId}
              canUpdate={canUpdateBank}
              canDelete={canDeleteBank}
              onSelect={(bankId) => {
                setSelectedBankId(bankId);
                setPage(1);
              }}
              onEdit={(bank) => {
                setBankDialogTarget(bank);
                setBankDialogOpen(true);
              }}
              onChanged={fetchBanks}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>
                Movimentos {selectedBank ? `- ${selectedBank.titulo}` : ""}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {selectedBank ? `${transactionCount} transacoes vinculadas a esta conta.` : "Selecione um banco para ver os lancamentos."}
              </p>
            </div>
            {canCreateTransaction && (
              <Button type="button" onClick={() => setTransactionDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nova transacao
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <TransactionTable
            transactions={transactions}
            loading={loadingTransactions}
            onChanged={refreshAll}
          />
          <div className="mt-4">
            <VehiclePagination page={page} totalPages={totalPages} setPage={setPage} />
          </div>
        </CardContent>
      </Card>

      <TypeCreateDialog
        mode={bankDialogOpen ? "bank" : null}
        target={bankDialogTarget}
        onOpenChange={(open) => {
          setBankDialogOpen(open);
          if (!open) setBankDialogTarget(null);
        }}
        onSuccess={() => {
          setBankDialogOpen(false);
          setBankDialogTarget(null);
          fetchBanks();
        }}
      />

      <TransactionDialog
        open={transactionDialogOpen}
        onOpenChange={setTransactionDialogOpen}
        onSuccess={() => {
          setTransactionDialogOpen(false);
          refreshAll();
        }}
      />
    </div>
  );
}

function BankKpis({ data }: { data: BankDashboardKpis }) {
  const items = [
    {
      title: "Saldo total",
      value: formatCurrency(data.saldo_total),
      hint: "Valor atual liquidado",
      icon: Wallet,
      className: data.saldo_total >= 0 ? "text-emerald-600" : "text-red-600",
    },
    {
      title: "Receitas",
      value: formatCurrency(data.total_receitas),
      hint: "Entradas liquidadas",
      icon: ArrowUpCircle,
      className: "text-emerald-600",
    },
    {
      title: "Despesas",
      value: formatCurrency(data.total_despesas),
      hint: "Saidas liquidadas",
      icon: ArrowDownCircle,
      className: "text-red-600",
    },
    {
      title: "Pendentes",
      value: formatCurrency(data.valor_pendente),
      hint: `${data.contas_ativas} contas ativas`,
      icon: Building2,
      className: "text-amber-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            <item.icon className={`h-4 w-4 ${item.className}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{item.value}</div>
            <p className="text-xs text-muted-foreground">{item.hint}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function BankKpisSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-32" />
      ))}
    </div>
  );
}

function BankTable({
  banks,
  selectedBankId,
  canUpdate,
  canDelete,
  onSelect,
  onEdit,
  onChanged,
}: {
  banks: BankAccountSummary[];
  selectedBankId: number | null;
  canUpdate: boolean;
  canDelete: boolean;
  onSelect: (bankId: number) => void;
  onEdit: (bank: BankAccountSummary) => void;
  onChanged: () => void;
}) {
  return (
    <div className="overflow-x-auto">
      <Table className="text-xs">
        <TableHeader>
          <TableRow>
            <TableHead>Banco / Conta</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Valor inicial</TableHead>
            <TableHead className="text-right">Receitas</TableHead>
            <TableHead className="text-right">Despesas</TableHead>
            <TableHead className="text-right">Saldo atual</TableHead>
            <TableHead className="text-center">Pendencias</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-right">Acoes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {banks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                Nenhum banco encontrado.
              </TableCell>
            </TableRow>
          ) : (
            banks.map((bank) => (
              <TableRow
                key={bank.id}
                className={`cursor-pointer ${selectedBankId === bank.id ? "bg-muted/60" : ""}`}
                onClick={() => onSelect(bank.id)}
              >
                <TableCell>
                  <div className="font-semibold">{bank.titulo}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {[bank.agencia, bank.conta_numero, bank.proprietario].filter(Boolean).join(" / ") || "-"}
                  </div>
                </TableCell>
                <TableCell>{bankAccountTypeLabel(bank.tipo)}</TableCell>
                <TableCell className="text-right">{formatCurrency(bank.valor_inicial)}</TableCell>
                <TableCell className="text-right text-emerald-600">{formatCurrency(bank.total_receitas)}</TableCell>
                <TableCell className="text-right text-red-600">{formatCurrency(bank.total_despesas)}</TableCell>
                <TableCell className={`text-right font-semibold ${bank.saldo_atual >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {formatCurrency(bank.saldo_atual)}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={bank.pendentes > 0 ? "outline" : "secondary"} className="font-normal">
                    {bank.pendentes} / {formatCurrency(bank.valor_pendente)}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={bank.ativo ? "secondary" : "outline"} className="font-normal">
                    {bank.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
                  <BankActions
                    bank={bank}
                    canUpdate={canUpdate}
                    canDelete={canDelete}
                    onEdit={() => onEdit(bank)}
                    onChanged={onChanged}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function BankActions({
  bank,
  canUpdate,
  canDelete,
  onEdit,
  onChanged,
}: {
  bank: BankAccountSummary;
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onChanged: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function updateStatus(ativo: boolean) {
    startTransition(async () => {
      const result = await updateBankAccountStatusAction(bank.id, ativo);
      if (result.success) {
        toast.success("Status atualizado");
        onChanged();
      } else {
        toast.error(result.error ?? "Erro ao atualizar status");
      }
    });
  }

  function deleteBank() {
    startTransition(async () => {
      const result = await deleteBankAccountAction(bank.id);
      if (result.success) {
        toast.success("Banco excluido");
        setConfirmOpen(false);
        onChanged();
      } else {
        toast.error(
          result.error?.includes("violates foreign key")
            ? "Nao foi possivel excluir: este banco ja esta em uso."
            : result.error ?? "Erro ao excluir banco",
        );
      }
    });
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Switch checked={bank.ativo} disabled={!canUpdate || isPending} onCheckedChange={updateStatus} />
      {canUpdate && (
        <Button type="button" variant="ghost" size="icon" onClick={onEdit} disabled={isPending}>
          <Edit className="h-4 w-4" />
        </Button>
      )}
      {canDelete && (
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={() => setConfirmOpen(true)}
            disabled={isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir banco?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acao remove o cadastro de {bank.titulo}. Bancos com transacoes vinculadas podem ser bloqueados pelo banco de dados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-0">
              <AlertDialogCancel className="mr-2" disabled={isPending}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isPending}
                onClick={deleteBank}
              >
                {isPending ? "Excluindo..." : "Sim, excluir"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
