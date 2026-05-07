"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type {
  BankAccount,
  BankAccountType,
  DocumentCategory,
  DynamicPaymentMethod,
  TransactionCategory,
} from "@/lib/type-catalog";
import type { PaymentMethod } from "@/lib/transactions";

type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

function parseMoney(value?: string | null) {
  if (!value) return 0;
  const normalized = value
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function revalidateTypes() {
  revalidatePath("/tipos");
  revalidatePath("/financeiro");
  revalidatePath("/bancos");
  revalidatePath("/veiculos");
}

export async function getTypeCatalogAction(): Promise<
  ActionResult<{
    categories: TransactionCategory[];
    bankAccounts: BankAccount[];
    paymentMethods: DynamicPaymentMethod[];
    documentCategories: DocumentCategory[];
  }>
> {
  const supabase = await createClient();
  const [categories, bankAccounts, paymentMethods, documentCategories] = await Promise.all([
    supabase
      .from("transaction_categories")
      .select("*")
      .order("ativo", { ascending: false })
      .order("nome", { ascending: true }),
    supabase
      .from("bank_accounts")
      .select("*")
      .order("ativo", { ascending: false })
      .order("titulo", { ascending: true }),
    supabase
      .from("payment_methods")
      .select("*")
      .order("ativo", { ascending: false })
      .order("nome", { ascending: true }),
    supabase
      .from("document_categories")
      .select("*")
      .order("ativo", { ascending: false })
      .order("nome", { ascending: true }),
  ]);

  if (categories.error) return { success: false, error: categories.error.message };
  if (bankAccounts.error) return { success: false, error: bankAccounts.error.message };
  if (paymentMethods.error) return { success: false, error: paymentMethods.error.message };
  if (documentCategories.error) return { success: false, error: documentCategories.error.message };

  return {
    success: true,
    data: {
      categories: (categories.data ?? []) as TransactionCategory[],
      bankAccounts: (bankAccounts.data ?? []).map((item) => ({
        ...(item as BankAccount),
        valor_inicial: Number(item.valor_inicial ?? 0),
      })),
      paymentMethods: (paymentMethods.data ?? []) as DynamicPaymentMethod[],
      documentCategories: (documentCategories.data ?? []) as DocumentCategory[],
    },
  };
}

export async function createTransactionCategoryAction(values: {
  nome: string;
  descricao?: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("transaction_categories").insert({
    nome: values.nome.trim().toUpperCase(),
    descricao: values.descricao?.trim() || null,
  });

  if (error) return { success: false, error: error.message };
  revalidateTypes();
  return { success: true };
}

export async function updateTransactionCategoryStatusAction(id: number, ativo: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("transaction_categories")
    .update({ ativo, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidateTypes();
  return { success: true };
}

export async function updateTransactionCategoryAction(
  id: number,
  values: {
    nome: string;
    descricao?: string;
    ativo: boolean;
  },
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("transaction_categories")
    .update({
      nome: values.nome.trim().toUpperCase(),
      descricao: values.descricao?.trim() || null,
      ativo: values.ativo,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidateTypes();
  return { success: true };
}

export async function deleteTransactionCategoryAction(id: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("transaction_categories")
    .delete()
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidateTypes();
  return { success: true };
}

export async function createDocumentCategoryAction(values: {
  nome: string;
  descricao?: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("document_categories").insert({
    nome: values.nome.trim().toUpperCase(),
    descricao: values.descricao?.trim() || null,
  });

  if (error) return { success: false, error: error.message };
  revalidateTypes();
  return { success: true };
}

export async function updateDocumentCategoryStatusAction(id: number, ativo: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("document_categories")
    .update({ ativo, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidateTypes();
  return { success: true };
}

export async function updateDocumentCategoryAction(
  id: number,
  values: {
    nome: string;
    descricao?: string;
    ativo: boolean;
  },
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("document_categories")
    .update({
      nome: values.nome.trim().toUpperCase(),
      descricao: values.descricao?.trim() || null,
      ativo: values.ativo,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidateTypes();
  return { success: true };
}

export async function deleteDocumentCategoryAction(id: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("document_categories")
    .delete()
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidateTypes();
  return { success: true };
}

export async function createBankAccountAction(values: {
  titulo: string;
  valor_inicial: string;
  agencia?: string;
  conta_numero?: string;
  tipo: BankAccountType;
  proprietario?: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("bank_accounts").insert({
    titulo: values.titulo.trim(),
    valor_inicial: parseMoney(values.valor_inicial),
    agencia: values.agencia?.trim() || null,
    conta_numero: values.conta_numero?.trim() || null,
    tipo: values.tipo,
    proprietario: values.proprietario?.trim() || null,
  });

  if (error) return { success: false, error: error.message };
  revalidateTypes();
  return { success: true };
}

export async function updateBankAccountStatusAction(id: number, ativo: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("bank_accounts")
    .update({ ativo, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidateTypes();
  return { success: true };
}

export async function updateBankAccountAction(
  id: number,
  values: {
    titulo: string;
    valor_inicial: string;
    agencia?: string;
    conta_numero?: string;
    tipo: BankAccountType;
    proprietario?: string;
    ativo: boolean;
  },
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("bank_accounts")
    .update({
      titulo: values.titulo.trim(),
      valor_inicial: parseMoney(values.valor_inicial),
      agencia: values.agencia?.trim() || null,
      conta_numero: values.conta_numero?.trim() || null,
      tipo: values.tipo,
      proprietario: values.proprietario?.trim() || null,
      ativo: values.ativo,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidateTypes();
  return { success: true };
}

export async function deleteBankAccountAction(id: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("bank_accounts").delete().eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidateTypes();
  return { success: true };
}

export async function createPaymentMethodAction(values: {
  nome: string;
  codigo: PaymentMethod;
  descricao?: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("payment_methods").insert({
    nome: values.nome.trim(),
    codigo: values.codigo,
    descricao: values.descricao?.trim() || null,
  });

  if (error) return { success: false, error: error.message };
  revalidateTypes();
  return { success: true };
}

export async function updatePaymentMethodStatusAction(id: number, ativo: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("payment_methods")
    .update({ ativo, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidateTypes();
  return { success: true };
}

export async function updatePaymentMethodAction(
  id: number,
  values: {
    nome: string;
    codigo: PaymentMethod;
    descricao?: string;
    ativo: boolean;
  },
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("payment_methods")
    .update({
      nome: values.nome.trim(),
      codigo: values.codigo,
      descricao: values.descricao?.trim() || null,
      ativo: values.ativo,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidateTypes();
  return { success: true };
}

export async function deletePaymentMethodAction(id: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("payment_methods").delete().eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidateTypes();
  return { success: true };
}
