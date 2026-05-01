export const CUSTOMER_PERSON_TYPES = ["PF", "PJ"] as const;
export const CUSTOMER_STATUSES = ["ATIVO", "INATIVO"] as const;

export type CustomerPersonType = (typeof CUSTOMER_PERSON_TYPES)[number];
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

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
  return type === "PF" ? "Pessoa fisica" : "Pessoa juridica";
}

export function customerStatusLabel(status: CustomerStatus) {
  return status === "ATIVO" ? "Ativo" : "Inativo";
}

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function isValidCpf(value: string) {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const calculateDigit = (base: string, factor: number) => {
    const total = base
      .split("")
      .reduce((sum, digit) => sum + Number(digit) * factor--, 0);
    const remainder = (total * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  const firstDigit = calculateDigit(cpf.slice(0, 9), 10);
  const secondDigit = calculateDigit(cpf.slice(0, 10), 11);

  return firstDigit === Number(cpf[9]) && secondDigit === Number(cpf[10]);
}

export function isValidCnpj(value: string) {
  const cnpj = onlyDigits(value);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

  const calculateDigit = (base: string, weights: number[]) => {
    const total = base
      .split("")
      .reduce((sum, digit, index) => sum + Number(digit) * weights[index], 0);
    const remainder = total % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstDigit = calculateDigit(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const secondDigit = calculateDigit(cnpj.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  return firstDigit === Number(cnpj[12]) && secondDigit === Number(cnpj[13]);
}

export function isValidCustomerDocument(type: CustomerPersonType, value: string) {
  return type === "PF" ? isValidCpf(value) : isValidCnpj(value);
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
