"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  Building2,
  CreditCard,
  Files,
  Edit,
  Loader2,
  Plus,
  Tags,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { AccessDenied } from "@/components/access-denied";
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
import {
  deleteBankAccountAction,
  deleteDocumentCategoryAction,
  deletePaymentMethodAction,
  deleteTransactionCategoryAction,
  getTypeCatalogAction,
  updateBankAccountStatusAction,
  updateDocumentCategoryStatusAction,
  updatePaymentMethodStatusAction,
  updateTransactionCategoryStatusAction,
} from "@/actions/type-catalog";
import {
  TypeCreateDialog,
  type TypeDialogMode,
  type TypeEditTarget,
} from "./components/type-create-dialog";
import { usePermissions } from "@/hooks/use-permissions";
import { formatCurrency } from "@/lib/utils";
import {
  bankAccountTypeLabel,
  type BankAccount,
  type DocumentCategory,
  type DynamicPaymentMethod,
  type TransactionCategory,
} from "@/lib/type-catalog";
import { paymentMethodLabel } from "@/lib/transactions";

type TabKey = "categories" | "documents" | "banks" | "payments";

export default function TypesPage() {
  const { hasPermission } = usePermissions();
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [documentCategories, setDocumentCategories] = useState<DocumentCategory[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<DynamicPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogMode, setDialogMode] = useState<TypeDialogMode>(null);
  const [editTarget, setEditTarget] = useState<TypeEditTarget>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("categories");

  const canView = hasPermission("types:view");
  const canCreate = hasPermission("types:create");
  const canUpdate = hasPermission("types:update");
  const canDelete = hasPermission("types:delete");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await getTypeCatalogAction();
    if (result.success && result.data) {
      setCategories(result.data.categories);
      setDocumentCategories(result.data.documentCategories);
      setBankAccounts(result.data.bankAccounts);
      setPaymentMethods(result.data.paymentMethods);
    } else {
      toast.error(result.error ?? "Erro ao carregar tipos");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!canView) return;
    const timeout = setTimeout(fetchData, 0);
    return () => clearTimeout(timeout);
  }, [canView, fetchData]);

  const navItems: {
    key: TabKey;
    label: string;
    description: string;
    icon: LucideIcon;
    count: number;
    dialogMode: TypeDialogMode;
    buttonLabel: string;
  }[] = [
      { key: "categories", label: "Categorias de transação", description: "Organize o fluxo de caixa", icon: Tags, count: categories.length, dialogMode: "category", buttonLabel: "Nova categoria" },
      { key: "documents", label: "Categorias de documentos", description: "Classifique os anexos", icon: Files, count: documentCategories.length, dialogMode: "documentCategory", buttonLabel: "Nova categoria" },
      { key: "banks", label: "Bancos e contas", description: "Caixas / contas bancárias", icon: Building2, count: bankAccounts.length, dialogMode: "bank", buttonLabel: "Novo banco" },
      { key: "payments", label: "Métodos de pagamento", description: "Formas de pagamento", icon: CreditCard, count: paymentMethods.length, dialogMode: "payment", buttonLabel: "Novo método" },
    ];

  const active = navItems.find((n) => n.key === activeTab)!;

  if (!canView) return <AccessDenied />;

  return (
    <>
      <div className="flex gap-0 overflow-hidden rounded-xl border border-white/6 bg-card">

        {/* ── Sidebar de navegação ───────────────────────────────────── */}
        <aside className="hidden w-[220px] shrink-0 flex-col border-r border-white/6 md:flex">
          <div className="border-b border-white/6 px-4 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cadastros</p>
          </div>
          <nav className="flex flex-1 flex-col gap-0.5 p-2">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)
              : navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveTab(item.key)}
                    className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${isActive ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-white/4 hover:text-foreground"}`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 transition-colors ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                    <div className="min-w-0">
                      <p className={`truncate text-xs font-semibold leading-tight ${isActive ? "text-foreground" : ""}`}>{item.label}</p>
                      <p className="truncate text-[10px] leading-tight text-muted-foreground">{item.description}</p>
                    </div>
                  </button>
                );
              })}
          </nav>
          <div className="border-t border-white/6 p-3">
            <button onClick={fetchData} disabled={loading} className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[11px] text-muted-foreground transition-colors hover:bg-white/4 hover:text-foreground disabled:opacity-50">
              <Loader2 className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
              Recarregar
            </button>
          </div>
        </aside>

        {/* ── Painel principal ────────────────────────────────────────── */}
        <div className="flex min-w-0 flex-1 flex-col">

          {/* Mobile tabs */}
          <div className="border-b border-white/6 px-4 pt-4 md:hidden">
            <div className="flex gap-1 overflow-x-auto pb-3">
              {navItems.map((item) => (
                <button key={item.key} type="button" onClick={() => setActiveTab(item.key)}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${activeTab === item.key ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {item.label.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-5">
            {loading ? (
              <Skeleton className="h-[420px] w-full" />
            ) : (
              <>
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">{active.label}</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">{active.description}</p>
                  </div>
                  {canCreate && (
                    <Button size="sm" className="shrink-0" onClick={() => { setEditTarget(null); setDialogMode(active.dialogMode); }}>
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      {active.buttonLabel}
                    </Button>
                  )}
                </div>
                {activeTab === "categories" && <CategoriesTable items={categories} onChanged={fetchData} canUpdate={canUpdate} canDelete={canDelete} onEdit={(item) => { setEditTarget(item); setDialogMode("category"); }} />}
                {activeTab === "documents" && <DocumentCategoriesTable items={documentCategories} onChanged={fetchData} canUpdate={canUpdate} canDelete={canDelete} onEdit={(item) => { setEditTarget(item); setDialogMode("documentCategory"); }} />}
                {activeTab === "banks" && <BankAccountsTable items={bankAccounts} onChanged={fetchData} canUpdate={canUpdate} canDelete={canDelete} onEdit={(item) => { setEditTarget(item); setDialogMode("bank"); }} />}
                {activeTab === "payments" && <PaymentMethodsTable items={paymentMethods} onChanged={fetchData} canUpdate={canUpdate} canDelete={canDelete} onEdit={(item) => { setEditTarget(item); setDialogMode("payment"); }} />}
              </>
            )}
          </div>
        </div>
      </div>
      <TypeCreateDialog
        mode={dialogMode}
        target={editTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDialogMode(null);
            setEditTarget(null);
          }
        }}
        onSuccess={() => {
          setDialogMode(null);
          setEditTarget(null);
          fetchData();
        }}
      />
    </>
  );
}

function StatusBadge({ ativo }: { ativo: boolean }) {
  return (
    <Badge variant={ativo ? "secondary" : "outline"} className="font-normal">
      {ativo ? "Ativo" : "Inativo"}
    </Badge>
  );
}

function CategoriesTable({
  items,
  onChanged,
  canUpdate,
  canDelete,
  onEdit,
}: {
  items: TransactionCategory[];
  onChanged: () => void;
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (item: TransactionCategory) => void;
}) {
  return (
    <TypeTableShell empty={items.length === 0}>
      {items.map((item) => (
        <TableRow key={item.id}>
          <TableCell className="font-medium">{item.nome}</TableCell>
          <TableCell>{item.descricao || "-"}</TableCell>
          <TableCell>Categoria</TableCell>
          <TableCell className="text-center"><StatusBadge ativo={item.ativo} /></TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end gap-2">
              <StatusSwitch ativo={item.ativo} onChange={(ativo) => updateTransactionCategoryStatusAction(item.id, ativo)} onChanged={onChanged} disabled={!canUpdate} />
              <RowActions
                canUpdate={canUpdate}
                canDelete={canDelete}
                onEdit={() => onEdit(item)}
                onDelete={() => deleteTransactionCategoryAction(item.id)}
                onChanged={onChanged}
              />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </TypeTableShell>
  );
}

function DocumentCategoriesTable({
  items,
  onChanged,
  canUpdate,
  canDelete,
  onEdit,
}: {
  items: DocumentCategory[];
  onChanged: () => void;
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (item: DocumentCategory) => void;
}) {
  return (
    <TypeTableShell empty={items.length === 0}>
      {items.map((item) => (
        <TableRow key={item.id}>
          <TableCell className="font-medium">{item.nome}</TableCell>
          <TableCell>{item.descricao || "-"}</TableCell>
          <TableCell>Documento</TableCell>
          <TableCell className="text-center"><StatusBadge ativo={item.ativo} /></TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end gap-2">
              <StatusSwitch ativo={item.ativo} onChange={(ativo) => updateDocumentCategoryStatusAction(item.id, ativo)} onChanged={onChanged} disabled={!canUpdate} />
              <RowActions
                canUpdate={canUpdate}
                canDelete={canDelete}
                onEdit={() => onEdit(item)}
                onDelete={() => deleteDocumentCategoryAction(item.id)}
                onChanged={onChanged}
              />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </TypeTableShell>
  );
}

function BankAccountsTable({
  items,
  onChanged,
  canUpdate,
  canDelete,
  onEdit,
}: {
  items: BankAccount[];
  onChanged: () => void;
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (item: BankAccount) => void;
}) {
  return (
    <div className="overflow-hidden rounded-md border">
      <Table className="text-xs">
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Agencia / Conta</TableHead>
            <TableHead>Proprietario</TableHead>
            <TableHead className="text-right">Valor inicial</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Nenhum banco cadastrado.</TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.titulo}</TableCell>
                <TableCell>{bankAccountTypeLabel(item.tipo)}</TableCell>
                <TableCell>{[item.agencia, item.conta_numero].filter(Boolean).join(" / ") || "-"}</TableCell>
                <TableCell>{item.proprietario || "-"}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.valor_inicial)}</TableCell>
                <TableCell className="text-center"><StatusBadge ativo={item.ativo} /></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <StatusSwitch ativo={item.ativo} onChange={(ativo) => updateBankAccountStatusAction(item.id, ativo)} onChanged={onChanged} disabled={!canUpdate} />
                    <RowActions
                      canUpdate={canUpdate}
                      canDelete={canDelete}
                      onEdit={() => onEdit(item)}
                      onDelete={() => deleteBankAccountAction(item.id)}
                      onChanged={onChanged}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function PaymentMethodsTable({
  items,
  onChanged,
  canUpdate,
  canDelete,
  onEdit,
}: {
  items: DynamicPaymentMethod[];
  onChanged: () => void;
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (item: DynamicPaymentMethod) => void;
}) {
  return (
    <TypeTableShell empty={items.length === 0}>
      {items.map((item) => (
        <TableRow key={item.id}>
          <TableCell className="font-medium">{item.nome}</TableCell>
          <TableCell>{paymentMethodLabel(item.codigo)}</TableCell>
          <TableCell>{item.descricao || "-"}</TableCell>
          <TableCell className="text-center"><StatusBadge ativo={item.ativo} /></TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end gap-2">
              <StatusSwitch ativo={item.ativo} onChange={(ativo) => updatePaymentMethodStatusAction(item.id, ativo)} onChanged={onChanged} disabled={!canUpdate} />
              <RowActions
                canUpdate={canUpdate}
                canDelete={canDelete}
                onEdit={() => onEdit(item)}
                onDelete={() => deletePaymentMethodAction(item.id)}
                onChanged={onChanged}
              />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </TypeTableShell>
  );
}

function TypeTableShell({ children, empty }: { children: ReactNode; empty: boolean }) {
  return (
    <div className="overflow-hidden rounded-md border">
      <Table className="text-xs">
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Descrição / Código</TableHead>
            <TableHead>Detalhe</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {empty ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Nenhum registro cadastrado.</TableCell>
            </TableRow>
          ) : children}
        </TableBody>
      </Table>
    </div>
  );
}

function StatusSwitch({
  ativo,
  onChange,
  onChanged,
  disabled = false,
}: {
  ativo: boolean;
  onChange: (ativo: boolean) => Promise<{ success: boolean; error?: string }>;
  onChanged: () => void;
  disabled?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Switch
      checked={ativo}
      disabled={isPending || disabled}
      onCheckedChange={(checked) => {
        startTransition(async () => {
          const result = await onChange(checked);
          if (result.success) {
            toast.success("Status atualizado");
            onChanged();
          } else {
            toast.error(result.error ?? "Erro ao atualizar status");
          }
        });
      }}
    />
  );
}

function RowActions({
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
  onChanged,
}: {
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => Promise<{ success: boolean; error?: string }>;
  onChanged: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleDelete() {
    startTransition(async () => {
      const result = await onDelete();
      if (result.success) {
        toast.success("Cadastro excluído");
        setConfirmOpen(false);
        onChanged();
      } else {
        toast.error(
          result.error?.includes("violates foreign key")
            ? "Não foi possível excluir: este cadastro já está em uso."
            : result.error ?? "Erro ao excluir cadastro",
        );
      }
    });
  }

  return (
    <>
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
              <AlertDialogTitle>Excluir cadastro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação remove o tipo permanentemente. Se ele já estiver em uso em alguma transação,
                o banco de dados pode bloquear a exclusao para preservar o historico.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-0">
              <AlertDialogCancel className="mr-2" disabled={isPending}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isPending}
                onClick={handleDelete}
              >
                {isPending ? "Excluindo..." : "Sim, excluir"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}

