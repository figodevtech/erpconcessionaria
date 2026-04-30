"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/utils/supabase/server";
import { checkPermission } from "@/utils/permissions";
import type {
  PaymentMethod,
  Transaction,
  TransactionFilters,
  TransactionFormValues,
  TransactionKpis,
  TransactionType,
} from "@/lib/transactions";

type ActionResult<T> = {
  success: boolean;
  data?: T;
  count?: number;
  error?: string;
};

function parseMoney(value?: string | null) {
  if (!value) return null;
  const normalized = value
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function nullableNumber(value?: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapTransaction(row: Record<string, unknown>): Transaction {
  return {
    ...(row as Omit<Transaction, "valor" | "valor_liquido">),
    valor: Number(row.valor ?? 0),
    valor_liquido: row.valor_liquido == null ? null : Number(row.valor_liquido),
  };
}

const paymentMethodCodes = [
  "DINHEIRO",
  "PIX",
  "CARTAO_CREDITO",
  "CARTAO_DEBITO",
  "TRANSFERENCIA",
  "BOLETO",
  "CHEQUE",
  "OUTRO",
] as const;

function toPaymentMethodCode(value?: string | null): PaymentMethod {
  return paymentMethodCodes.includes(value as PaymentMethod)
    ? (value as PaymentMethod)
    : "OUTRO";
}

function getTransactionSelect() {
  return "*, vehicle:vehicles(id, brand, model, plate), category:transaction_categories(id, nome), bank_account:bank_accounts(id, titulo), payment_method:payment_methods(id, nome, codigo)";
}

export async function listTransactionsAction(
  filters: TransactionFilters = {},
): Promise<ActionResult<Transaction[]>> {
  const supabase = await createClient();
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 10;

  let query = supabase
    .from("transactions")
    .select(getTransactionSelect(), { count: "exact" })
    .eq("is_deleted", false);

  if (filters.vehicleId) {
    query = query.eq("vehicle_id", filters.vehicleId);
  }

  if (filters.tipo && filters.tipo !== "TODOS") {
    query = query.eq("tipo", filters.tipo);
  }

  if (filters.search?.trim()) {
    const search = filters.search.trim();
    query = query.or(
      `descricao.ilike.%${search}%,categoria.ilike.%${search}%,nome_pagador.ilike.%${search}%,cpf_cnpj_pagador.ilike.%${search}%`,
    );
  }

  const { data, error, count } = await query
    .range((page - 1) * pageSize, page * pageSize - 1)
    .order("data", { ascending: false })
    .order("id", { ascending: false });

  if (error) return { success: false, error: error.message };

  return {
    success: true,
    data: ((data ?? []) as unknown as Record<string, unknown>[]).map((row) =>
      mapTransaction(row),
    ),
    count: count ?? 0,
  };
}

export async function getTransactionKpisAction(
  vehicleId?: number,
): Promise<ActionResult<TransactionKpis>> {
  const supabase = await createClient();

  let query = supabase
    .from("transactions")
    .select("tipo, valor, pendente")
    .eq("is_deleted", false);

  if (vehicleId) {
    query = query.eq("vehicle_id", vehicleId);
  }

  const { data, error } = await query;
  if (error) return { success: false, error: error.message };

  const rows = data ?? [];
  const totalReceitas = rows
    .filter((row) => row.tipo === "RECEITA")
    .reduce((acc, row) => acc + Number(row.valor ?? 0), 0);
  const totalDespesas = rows
    .filter((row) => row.tipo === "DESPESA")
    .reduce((acc, row) => acc + Number(row.valor ?? 0), 0);
  const pendentes = rows.filter((row) => row.pendente).length;

  return {
    success: true,
    data: {
      totalReceitas,
      totalDespesas,
      saldo: totalReceitas - totalDespesas,
      pendentes,
    },
  };
}

export async function createTransactionAction(
  values: TransactionFormValues,
): Promise<ActionResult<Transaction>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Usuario nao autenticado." };

  const canCreate = await checkPermission("finance:create");
  if (!canCreate) {
    return { success: false, error: "Voce nao tem permissao para criar transacoes." };
  }

  const { supabase: admin, error: adminError } = await createAdminClient();
  if (adminError || !admin) {
    return { success: false, error: "Cliente administrativo do Supabase nao configurado." };
  }

  const valor = parseMoney(values.valor);
  if (valor == null || valor < 0) {
    return { success: false, error: "Informe um valor valido." };
  }

  let selectedCategoryName = values.categoria?.trim() || "NAO RELACIONADO";
  if (values.categoria_id) {
    const { data: category } = await admin
      .from("transaction_categories")
      .select("nome")
      .eq("id", Number(values.categoria_id))
      .maybeSingle();
    selectedCategoryName = category?.nome || selectedCategoryName;
  }

  let selectedPaymentCode: PaymentMethod = values.metodo_pagamento as PaymentMethod;
  if (values.payment_method_id) {
    const { data: paymentMethod } = await admin
      .from("payment_methods")
      .select("codigo")
      .eq("id", Number(values.payment_method_id))
      .maybeSingle();
    selectedPaymentCode = toPaymentMethodCode(paymentMethod?.codigo);
  }

  const payload = {
    descricao: values.descricao.trim(),
    valor,
    data: values.data,
    metodo_pagamento: selectedPaymentCode,
    categoria: selectedCategoryName,
    tipo: values.tipo as TransactionType,
    vehicle_id: nullableNumber(values.vehicle_id),
    venda_id: nullableNumber(values.venda_id),
    categoria_id: nullableNumber(values.categoria_id),
    banco_id: nullableNumber(values.banco_id),
    payment_method_id: nullableNumber(values.payment_method_id),
    nome_pagador: values.nome_pagador.trim(),
    cpf_cnpj_pagador: values.cpf_cnpj_pagador.trim(),
    valor_liquido: parseMoney(values.valor_liquido) ?? valor,
    pendente: values.pendente,
    created_by: user.id,
    updated_by: user.id,
  };

  if (!payload.descricao || !payload.nome_pagador || !payload.cpf_cnpj_pagador) {
    return { success: false, error: "Preencha os campos obrigatorios." };
  }

  const { data, error } = await admin
    .from("transactions")
    .insert(payload)
    .select(getTransactionSelect())
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/financeiro");
  revalidatePath("/veiculos");

  return { success: true, data: mapTransaction(data as unknown as Record<string, unknown>) };
}

export async function softDeleteTransactionAction(id: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Usuario nao autenticado." };

  const canDelete = await checkPermission("finance:delete");
  if (!canDelete) {
    return { success: false, error: "Voce nao tem permissao para excluir transacoes." };
  }

  const { supabase: admin, error: adminError } = await createAdminClient();
  if (adminError || !admin) {
    return { success: false, error: "Cliente administrativo do Supabase nao configurado." };
  }

  const { error } = await admin
    .from("transactions")
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: user.id,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/financeiro");
  revalidatePath("/veiculos");
  return { success: true };
}
