import type { PaymentMethod } from "@/lib/transactions";

export const BANK_ACCOUNT_TYPES = [
  "CORRENTE",
  "POUPANCA",
  "CAIXA",
  "CARTAO",
  "INVESTIMENTO",
  "OUTRO",
] as const;

export type BankAccountType = (typeof BANK_ACCOUNT_TYPES)[number];

export type TransactionCategory = {
  id: number;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
};

export type BankAccount = {
  id: number;
  titulo: string;
  created_at: string;
  updated_at: string;
  valor_inicial: number;
  agencia: string | null;
  conta_numero: string | null;
  tipo: BankAccountType;
  proprietario: string | null;
  ativo: boolean;
};

export type DynamicPaymentMethod = {
  id: number;
  nome: string;
  codigo: PaymentMethod;
  descricao: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
};

export type DocumentCategory = {
  id: number;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
};

export function bankAccountTypeLabel(type: BankAccountType) {
  const labels: Record<BankAccountType, string> = {
    CORRENTE: "Conta corrente",
    POUPANCA: "Poupanca",
    CAIXA: "Caixa",
    CARTAO: "Cartao",
    INVESTIMENTO: "Investimento",
    OUTRO: "Outro",
  };

  return labels[type];
}
