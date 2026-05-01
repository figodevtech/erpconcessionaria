"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { checkPermission } from "@/utils/permissions";
import {
  CUSTOMER_PERSON_TYPES,
  CUSTOMER_RANKS,
  CUSTOMER_STATUSES,
  onlyDigits,
  type Customer,
  type CustomerFilters,
  type CustomerFormValues,
  type CustomerKpis,
  type CustomerPersonType,
  type CustomerRank,
  type CustomerStatus,
} from "@/lib/customers";

type ActionResult<T> = {
  success: boolean;
  data?: T;
  count?: number;
  error?: string;
};

function mapCustomer(row: Record<string, unknown>): Customer {
  return {
    ...(row as Customer),
    id: Number(row.id),
  };
}

function toNullableText(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizePersonType(value: string): CustomerPersonType {
  return CUSTOMER_PERSON_TYPES.includes(value as CustomerPersonType)
    ? (value as CustomerPersonType)
    : "PF";
}

function normalizeStatus(value: string): CustomerStatus {
  return CUSTOMER_STATUSES.includes(value as CustomerStatus)
    ? (value as CustomerStatus)
    : "ATIVO";
}

function normalizeRank(value?: string | null): CustomerRank | null {
  return CUSTOMER_RANKS.includes(value as CustomerRank)
    ? (value as CustomerRank)
    : null;
}

function normalizeCustomer(values: CustomerFormValues) {
  return {
    person_type: normalizePersonType(values.person_type),
    cpf_cnpj: onlyDigits(values.cpf_cnpj),
    name: values.name.trim(),
    email: values.email.trim().toLowerCase(),
    phone: onlyDigits(values.phone),
    address: toNullableText(values.address),
    address_number: toNullableText(values.address_number),
    address_complement: toNullableText(values.address_complement),
    neighborhood: toNullableText(values.neighborhood),
    city: values.city.trim(),
    state: values.state.trim().toUpperCase(),
    zip_code: values.zip_code ? onlyDigits(values.zip_code) || null : null,
    state_registration: toNullableText(values.state_registration),
    municipal_registration: toNullableText(values.municipal_registration),
    city_code: toNullableText(values.city_code),
    status: normalizeStatus(values.status),
    rank: normalizeRank(values.rank),
  };
}

function validateCustomer(values: ReturnType<typeof normalizeCustomer>) {
  if (!values.name || !values.cpf_cnpj || !values.email || !values.phone || !values.city || !values.state) {
    return "Preencha nome, CPF/CNPJ, e-mail, telefone, cidade e estado.";
  }

  const expectedDocumentLength = values.person_type === "PF" ? 11 : 14;
  if (values.cpf_cnpj.length !== expectedDocumentLength) {
    return values.person_type === "PF"
      ? "Informe um CPF com 11 dígitos."
      : "Informe um CNPJ com 14 dígitos.";
  }

  if (values.state.length !== 2) {
    return "Informe o estado usando a UF com 2 letras.";
  }

  return null;
}

export async function listCustomersAction(
  filters: CustomerFilters = {},
): Promise<ActionResult<Customer[]>> {
  const supabase = await createClient();
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 10;
  const search = filters.search?.trim() ?? "";

  let query = supabase
    .from("customers")
    .select("*", { count: "exact" })
    .eq("is_deleted", false);

  if (filters.status && filters.status !== "TODOS") {
    query = query.eq("status", filters.status);
  }

  if (filters.personType && filters.personType !== "TODOS") {
    query = query.eq("person_type", filters.personType);
  }

  if (search) {
    const digits = onlyDigits(search);
    const clauses = [
      `name.ilike.%${search}%`,
      `email.ilike.%${search}%`,
      `phone.ilike.%${digits || search}%`,
      `cpf_cnpj.ilike.%${digits || search}%`,
      `city.ilike.%${search}%`,
    ];
    query = query.or(clauses.join(","));
  }

  const { data, error, count } = await query
    .range((page - 1) * pageSize, page * pageSize - 1)
    .order("created_at", { ascending: false });

  if (error) return { success: false, error: error.message };

  return {
    success: true,
    data: ((data ?? []) as unknown as Record<string, unknown>[]).map(mapCustomer),
    count: count ?? 0,
  };
}

export async function getCustomerKpisAction(): Promise<ActionResult<CustomerKpis>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("status, person_type")
    .eq("is_deleted", false);

  if (error) return { success: false, error: error.message };

  const customers = data ?? [];
  return {
    success: true,
    data: {
      total: customers.length,
      active: customers.filter((customer) => customer.status === "ATIVO").length,
      inactive: customers.filter((customer) => customer.status === "INATIVO").length,
      companies: customers.filter((customer) => customer.person_type === "PJ").length,
    },
  };
}

export async function createCustomerAction(
  values: CustomerFormValues,
): Promise<ActionResult<Customer>> {
  const allowed = await checkPermission("customers:create");
  if (!allowed) return { success: false, error: "Você não tem permissão para criar clientes." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Usuário não autenticado." };

  const payload = normalizeCustomer(values);
  const validationError = validateCustomer(payload);
  if (validationError) return { success: false, error: validationError };

  const { data, error } = await supabase
    .from("customers")
    .insert({
      ...payload,
      created_by: user.id,
      updated_by: user.id,
      ranked_by: payload.rank ? user.id : null,
      ranked_at: payload.rank ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/clientes");
  return { success: true, data: mapCustomer(data as unknown as Record<string, unknown>) };
}

export async function updateCustomerAction(
  id: number,
  values: CustomerFormValues,
): Promise<ActionResult<Customer>> {
  const allowed = await checkPermission("customers:update");
  if (!allowed) return { success: false, error: "Você não tem permissão para editar clientes." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Usuário não autenticado." };

  const payload = normalizeCustomer(values);
  const validationError = validateCustomer(payload);
  if (validationError) return { success: false, error: validationError };

  const { data, error } = await supabase
    .from("customers")
    .update({
      ...payload,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
      ranked_by: payload.rank ? user.id : null,
      ranked_at: payload.rank ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .eq("is_deleted", false)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath("/clientes");
  return { success: true, data: mapCustomer(data as unknown as Record<string, unknown>) };
}

export async function deleteCustomerAction(id: number) {
  const allowed = await checkPermission("customers:delete");
  if (!allowed) return { success: false, error: "Você não tem permissão para excluir clientes." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Usuário não autenticado." };

  const { error } = await supabase
    .from("customers")
    .update({
      is_deleted: true,
      status: "INATIVO",
      deleted_at: new Date().toISOString(),
      deleted_by: user.id,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/clientes");
  return { success: true };
}
