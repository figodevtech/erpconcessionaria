"use client";

import { useEffect, useState, useTransition } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import {
  createBankAccountAction,
  createDocumentCategoryAction,
  createPaymentMethodAction,
  createTransactionCategoryAction,
  updateBankAccountAction,
  updateDocumentCategoryAction,
  updatePaymentMethodAction,
  updateTransactionCategoryAction,
} from "@/actions/type-catalog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  BANK_ACCOUNT_TYPES,
  bankAccountTypeLabel,
  type BankAccount,
  type BankAccountType,
  type DocumentCategory,
  type DynamicPaymentMethod,
  type TransactionCategory,
} from "@/lib/type-catalog";
import { PAYMENT_METHODS, paymentMethodLabel, type PaymentMethod } from "@/lib/transactions";

export type TypeDialogMode = "category" | "documentCategory" | "bank" | "payment" | null;
export type TypeEditTarget = TransactionCategory | DocumentCategory | BankAccount | DynamicPaymentMethod | null;

export function TypeCreateDialog({
  mode,
  target,
  onOpenChange,
  onSuccess,
}: {
  mode: TypeDialogMode;
  target: TypeEditTarget;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    titulo: "",
    valor_inicial: "0,00",
    agencia: "",
    conta_numero: "",
    tipo: "CORRENTE" as BankAccountType,
    proprietario: "",
    codigo: "PIX" as PaymentMethod,
    ativo: true,
  });

  const open = mode !== null;
  const isEditing = Boolean(target);
  const titlePrefix = isEditing ? "Editar" : "Novo";
  const title =
    mode === "category" || mode === "documentCategory"
      ? `${titlePrefix} categoria`
      : mode === "bank"
        ? `${titlePrefix} banco`
        : `${titlePrefix} metodo`;

  useEffect(() => {
    if (!open) return;

    const timeout = setTimeout(() => {
      if (!target) {
        setForm({
          nome: "",
          descricao: "",
          titulo: "",
          valor_inicial: "0,00",
          agencia: "",
          conta_numero: "",
          tipo: "CORRENTE",
          proprietario: "",
          codigo: "PIX",
          ativo: true,
        });
        return;
      }

      if ((mode === "category" || mode === "documentCategory") && "nome" in target) {
        setForm((prev) => ({
          ...prev,
          nome: target.nome,
          descricao: target.descricao || "",
          ativo: target.ativo,
        }));
      }

      if (mode === "bank" && "titulo" in target) {
        setForm((prev) => ({
          ...prev,
          titulo: target.titulo,
          valor_inicial: target.valor_inicial.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
          agencia: target.agencia || "",
          conta_numero: target.conta_numero || "",
          tipo: target.tipo,
          proprietario: target.proprietario || "",
          ativo: target.ativo,
        }));
      }

      if (mode === "payment" && "codigo" in target) {
        setForm((prev) => ({
          ...prev,
          nome: target.nome,
          codigo: target.codigo,
          descricao: target.descricao || "",
          ativo: target.ativo,
        }));
      }
    }, 0);

    return () => clearTimeout(timeout);
  }, [mode, open, target]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function submit() {
    startTransition(async () => {
      const result =
        mode === "category"
          ? isEditing && target
            ? await updateTransactionCategoryAction(target.id, {
              nome: form.nome,
              descricao: form.descricao,
              ativo: form.ativo,
            })
            : await createTransactionCategoryAction({ nome: form.nome, descricao: form.descricao })
          : mode === "documentCategory"
            ? isEditing && target
              ? await updateDocumentCategoryAction(target.id, {
                nome: form.nome,
                descricao: form.descricao,
                ativo: form.ativo,
              })
              : await createDocumentCategoryAction({ nome: form.nome, descricao: form.descricao })
            : mode === "bank"
              ? isEditing && target
                ? await updateBankAccountAction(target.id, {
                  titulo: form.titulo,
                  valor_inicial: form.valor_inicial,
                  agencia: form.agencia,
                  conta_numero: form.conta_numero,
                  tipo: form.tipo,
                  proprietario: form.proprietario,
                  ativo: form.ativo,
                })
                : await createBankAccountAction({
                  titulo: form.titulo,
                  valor_inicial: form.valor_inicial,
                  agencia: form.agencia,
                  conta_numero: form.conta_numero,
                  tipo: form.tipo,
                  proprietario: form.proprietario,
                })
              : isEditing && target
                ? await updatePaymentMethodAction(target.id, {
                  nome: form.nome,
                  codigo: form.codigo,
                  descricao: form.descricao,
                  ativo: form.ativo,
                })
                : await createPaymentMethodAction({
                  nome: form.nome,
                  codigo: form.codigo,
                  descricao: form.descricao,
                });

      if (result.success) {
        toast.success(isEditing ? "Cadastro atualizado" : "Cadastro criado");
        setForm({
          nome: "",
          descricao: "",
          titulo: "",
          valor_inicial: "0,00",
          agencia: "",
          conta_numero: "",
          tipo: "CORRENTE",
          proprietario: "",
          codigo: "PIX",
          ativo: true,
        });
        onSuccess();
      } else {
        toast.error(result.error ?? "Erro ao criar cadastro");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Preencha os dados para disponibilizar este tipo nos modulos financeiros.</DialogDescription>
        </DialogHeader>

        {mode === "bank" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Titulo"><Input value={form.titulo} onChange={(event) => update("titulo", event.target.value)} /></Field>
            <Field label="Valor inicial"><Input value={form.valor_inicial} onChange={(event) => update("valor_inicial", event.target.value)} /></Field>
            <Field label="Tipo">
              <Select value={form.tipo} onValueChange={(value) => update("tipo", value as BankAccountType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {BANK_ACCOUNT_TYPES.map((type) => <SelectItem key={type} value={type}>{bankAccountTypeLabel(type)}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Proprietario"><Input value={form.proprietario} onChange={(event) => update("proprietario", event.target.value)} /></Field>
            <Field label="Agencia"><Input value={form.agencia} onChange={(event) => update("agencia", event.target.value)} /></Field>
            <Field label="Conta"><Input value={form.conta_numero} onChange={(event) => update("conta_numero", event.target.value)} /></Field>
            <ActiveField ativo={form.ativo} onChange={(value) => update("ativo", value)} />
          </div>
        ) : (
          <div className="grid gap-4">
            <Field label="Nome"><Input value={form.nome} onChange={(event) => update("nome", event.target.value)} /></Field>
            {mode === "payment" && (
              <Field label="Codigo fiscal">
                <Select value={form.codigo} onValueChange={(value) => update("codigo", value as PaymentMethod)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {PAYMENT_METHODS.map((method) => <SelectItem key={method} value={method}>{paymentMethodLabel(method)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            )}
            <Field label="Descricao">
              <Textarea value={form.descricao} onChange={(event) => update("descricao", event.target.value)} className="resize-none" />
            </Field>
            <ActiveField ativo={form.ativo} onChange={(value) => update("ativo", value)} />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancelar</Button>
          <Button onClick={submit} disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            {isEditing ? "Atualizar" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ActiveField({
  ativo,
  onChange,
}: {
  ativo: boolean;
  onChange: (ativo: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border bg-muted/20 p-3">
      <div>
        <Label>Ativo</Label>
        <p className="text-xs text-muted-foreground">Disponivel para uso em novos lancamentos.</p>
      </div>
      <Switch checked={ativo} onCheckedChange={onChange} />
    </div>
  );
}
