"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/utils/supabase/server";
import { checkPermission } from "@/utils/permissions";
import type {
  PaymentMethod,
  Transaction,
  TransactionAttachment,
  TransactionFilters,
  TransactionFormValues,
  TransactionKpis,
  TransactionType,
} from "@/lib/transactions";

const ATTACHMENTS_BUCKET = "transaction-attachments";

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

function mapAttachment(row: Record<string, unknown>): TransactionAttachment {
  return {
    ...(row as Omit<TransactionAttachment, "file_size">),
    file_size: row.file_size == null ? null : Number(row.file_size),
  };
}

function mapTransaction(row: Record<string, unknown>): Transaction {
  const attachments = Array.isArray(row.attachments)
    ? (row.attachments as Record<string, unknown>[])
        .filter((attachment) => attachment.is_deleted !== true)
        .map(mapAttachment)
    : [];

  return {
    ...(row as Omit<Transaction, "valor" | "valor_liquido" | "attachments">),
    valor: Number(row.valor ?? 0),
    valor_liquido: row.valor_liquido == null ? null : Number(row.valor_liquido),
    attachments,
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
  return "*, vehicle:vehicles(id, brand, model, plate), category:transaction_categories(id, nome), bank_account:bank_accounts(id, titulo), payment_method:payment_methods(id, nome, codigo), attachments:transaction_attachments(*)";
}

function sanitizeFileName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

function formDataToTransactionValues(formData: FormData): TransactionFormValues {
  const get = (key: keyof TransactionFormValues) => formData.get(key)?.toString() ?? "";

  return {
    descricao: get("descricao"),
    valor: get("valor"),
    data: get("data"),
    metodo_pagamento: get("metodo_pagamento") as PaymentMethod,
    categoria: get("categoria"),
    tipo: get("tipo") as TransactionType,
    vehicle_id: get("vehicle_id"),
    venda_id: get("venda_id"),
    categoria_id: get("categoria_id"),
    banco_id: get("banco_id"),
    payment_method_id: get("payment_method_id"),
    nome_pagador: get("nome_pagador"),
    cpf_cnpj_pagador: get("cpf_cnpj_pagador"),
    valor_liquido: get("valor_liquido"),
    pendente: formData.get("pendente") === "true",
  };
}

function getAttachment(values: TransactionFormValues | FormData) {
  if (!(values instanceof FormData)) return null;
  const file = values.get("attachment");
  return file instanceof File && file.size > 0 ? file : null;
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
  input: TransactionFormValues | FormData,
): Promise<ActionResult<Transaction>> {
  const values = input instanceof FormData ? formDataToTransactionValues(input) : input;
  const attachment = getAttachment(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Usuário não autenticado." };

  const canCreate = await checkPermission("finance:create");
  if (!canCreate) {
    return { success: false, error: "Você não tem permissão para criar transações." };
  }

  const { supabase: admin, error: adminError } = await createAdminClient();
  if (adminError || !admin) {
    return { success: false, error: "Cliente administrativo do Supabase não configurado." };
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

  let transaction = mapTransaction(data as unknown as Record<string, unknown>);

  if (attachment) {
    if (!["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(attachment.type)) {
      await admin.from("transactions").delete().eq("id", transaction.id);
      return { success: false, error: "Anexe apenas PDF ou imagem JPG, PNG ou WebP." };
    }

    const safeName = sanitizeFileName(attachment.name);
    const filePath = `${transaction.id}/${Date.now()}-${safeName}`;
    const buffer = Buffer.from(await attachment.arrayBuffer());

    const { error: uploadError } = await admin.storage
      .from(ATTACHMENTS_BUCKET)
      .upload(filePath, buffer, {
        contentType: attachment.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      await admin.from("transactions").delete().eq("id", transaction.id);
      return { success: false, error: uploadError.message };
    }

    const { data: signed } = await admin.storage
      .from(ATTACHMENTS_BUCKET)
      .createSignedUrl(filePath, 60 * 60);

    const { data: attachmentData, error: attachmentError } = await admin
      .from("transaction_attachments")
      .insert({
        transaction_id: transaction.id,
        file_name: attachment.name,
        file_path: filePath,
        file_url: signed?.signedUrl || filePath,
        file_size: attachment.size,
        mime_type: attachment.type || null,
        created_by: user.id,
        updated_by: user.id,
      })
      .select("*")
      .single();

    if (attachmentError) {
      await admin.storage.from(ATTACHMENTS_BUCKET).remove([filePath]);
      await admin.from("transactions").delete().eq("id", transaction.id);
      return { success: false, error: attachmentError.message };
    }

    transaction = {
      ...transaction,
      attachments: [mapAttachment(attachmentData as unknown as Record<string, unknown>)],
    };
  }

  revalidatePath("/financeiro");
  revalidatePath("/veiculos");

  return { success: true, data: transaction };
}

export async function softDeleteTransactionAction(id: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Usuário não autenticado." };

  const canDelete = await checkPermission("finance:delete");
  if (!canDelete) {
    return { success: false, error: "Você não tem permissão para excluir transações." };
  }

  const { supabase: admin, error: adminError } = await createAdminClient();
  if (adminError || !admin) {
    return { success: false, error: "Cliente administrativo do Supabase não configurado." };
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

  const { data: attachments } = await admin
    .from("transaction_attachments")
    .select("file_path")
    .eq("transaction_id", id)
    .eq("is_deleted", false);

  const paths = (attachments ?? [])
    .map((attachment) => attachment.file_path)
    .filter(Boolean);

  if (paths.length > 0) {
    await admin.storage.from(ATTACHMENTS_BUCKET).remove(paths);
    await admin
      .from("transaction_attachments")
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("transaction_id", id);
  }

  revalidatePath("/financeiro");
  revalidatePath("/veiculos");
  return { success: true };
}

export async function getTransactionAttachmentUrlAction(id: number): Promise<ActionResult<string>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Usuário não autenticado." };

  const canView = await checkPermission("finance:view");
  if (!canView) {
    return { success: false, error: "Você não tem permissão para visualizar anexos financeiros." };
  }

  const { supabase: admin, error: adminError } = await createAdminClient();
  if (adminError || !admin) {
    return { success: false, error: "Cliente administrativo do Supabase não configurado." };
  }

  const { data: attachment, error } = await admin
    .from("transaction_attachments")
    .select("file_path")
    .eq("id", id)
    .eq("is_deleted", false)
    .single();

  if (error) return { success: false, error: error.message };

  const { data, error: signedError } = await admin.storage
    .from(ATTACHMENTS_BUCKET)
    .createSignedUrl(attachment.file_path, 60 * 10);

  if (signedError) return { success: false, error: signedError.message };
  return { success: true, data: data.signedUrl };
}
