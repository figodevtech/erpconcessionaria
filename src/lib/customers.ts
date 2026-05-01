export const CUSTOMER_PERSON_TYPES = ["PF", "PJ"] as const;
export const CUSTOMER_STATUSES = ["ATIVO", "INATIVO"] as const;
export const CUSTOMER_RANKS = ["LEAD", "BRONZE", "PRATA", "OURO", "VIP"] as const;

export type CustomerPersonType = (typeof CUSTOMER_PERSON_TYPES)[number];
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];
export type CustomerRank = (typeof CUSTOMER_RANKS)[number];

export type Customer = {
  id: number;
  person_type: CustomerPersonType;
  cpf_cnpj: string;
  name: string;
  email: string;
  phone: string;
  address: string | null;
  address_number: string | null;
  address_complement: string | null;
  neighborhood: string | null;
  city: string;
  state: string;
  zip_code: string | null;
  state_registration: string | null;
  municipal_registration: string | null;
  city_code: string | null;
  status: CustomerStatus;
  rank: CustomerRank | null;
  ranked_by: string | null;
  ranked_at: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
};

export type CustomerFormValues = {
  person_type: CustomerPersonType;
  cpf_cnpj: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  address_number?: string;
  address_complement?: string;
  neighborhood?: string;
  city: string;
  state: string;
  zip_code?: string;
  state_registration?: string;
  municipal_registration?: string;
  city_code?: string;
  status: CustomerStatus;
  rank?: CustomerRank | "";
};

export type CustomerFilters = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: "TODOS" | CustomerStatus;
  personType?: "TODOS" | CustomerPersonType;
};

export type CustomerKpis = {
  total: number;
  active: number;
  inactive: number;
  companies: number;
};

export function customerPersonTypeLabel(type: CustomerPersonType) {
  return type === "PF" ? "Pessoa física" : "Pessoa jurídica";
}

export function customerStatusLabel(status: CustomerStatus) {
  return status === "ATIVO" ? "Ativo" : "Inativo";
}

export function customerRankLabel(rank?: CustomerRank | null) {
  if (!rank) return "Sem classificação";
  const labels: Record<CustomerRank, string> = {
    LEAD: "Lead",
    BRONZE: "Bronze",
    PRATA: "Prata",
    OURO: "Ouro",
    VIP: "VIP",
  };
  return labels[rank];
}

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function formatCpfCnpj(value: string) {
  const digits = onlyDigits(value);
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  return digits
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

export function formatPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  }

  return digits
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

export function formatZipCode(value: string) {
  return onlyDigits(value).slice(0, 8).replace(/(\d{5})(\d{1,3})$/, "$1-$2");
}
