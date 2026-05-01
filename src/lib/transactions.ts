export const TRANSACTION_TYPES = ["RECEITA", "DESPESA"] as const;
export const PAYMENT_METHODS = [
  "DINHEIRO",
  "PIX",
  "CARTAO_CREDITO",
  "CARTAO_DEBITO",
  "TRANSFERENCIA",
  "BOLETO",
  "CHEQUE",
  "OUTRO",
] as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type Transaction = {
  id: number;
  created_at: string;
  updated_at: string;
  descricao: string;
  valor: number;
  data: string;
  metodo_pagamento: PaymentMethod;
  categoria: string;
  tipo: TransactionType;
  vehicle_id: number | null;
  venda_id: number | null;
  categoria_id: number | null;
  banco_id: number | null;
  payment_method_id: number | null;
  nome_pagador: string;
  cpf_cnpj_pagador: string;
  valor_liquido: number | null;
  pendente: boolean;
  created_by: string | null;
  updated_by: string | null;
  is_deleted: boolean;
  vehicle?: {
    id: number;
    brand: string | null;
    model: string | null;
    plate: string | null;
  } | null;
  category?: {
    id: number;
    nome: string;
  } | null;
  bank_account?: {
    id: number;
    titulo: string;
  } | null;
  payment_method?: {
    id: number;
    nome: string;
    codigo: PaymentMethod;
  } | null;
  attachments?: TransactionAttachment[];
};

export type TransactionAttachment = {
  id: number;
  transaction_id: number;
  file_name: string;
  file_path: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  is_deleted: boolean;
};

export type TransactionFormValues = {
  descricao: string;
  valor: string;
  data: string;
  metodo_pagamento: PaymentMethod;
  categoria: string;
  tipo: TransactionType;
  vehicle_id?: string;
  venda_id?: string;
  categoria_id?: string;
  banco_id?: string;
  payment_method_id?: string;
  nome_pagador: string;
  cpf_cnpj_pagador: string;
  valor_liquido?: string;
  pendente: boolean;
};

export type TransactionFilters = {
  page?: number;
  pageSize?: number;
  search?: string;
  tipo?: "TODOS" | TransactionType;
  vehicleId?: number;
};

export type TransactionKpis = {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  pendentes: number;
};

export function paymentMethodLabel(method: PaymentMethod) {
  const labels: Record<PaymentMethod, string> = {
    DINHEIRO: "Dinheiro",
    PIX: "PIX",
    CARTAO_CREDITO: "Cartao de credito",
    CARTAO_DEBITO: "Cartao de debito",
    TRANSFERENCIA: "Transferencia",
    BOLETO: "Boleto",
    CHEQUE: "Cheque",
    OUTRO: "Outro",
  };

  return labels[method];
}

export function transactionTypeLabel(type: TransactionType) {
  return type === "RECEITA" ? "Receita" : "Despesa";
}
