import type { BankAccount } from "@/lib/type-catalog";

export type BankAccountSummary = BankAccount & {
  saldo_atual: number;
  total_receitas: number;
  total_despesas: number;
  pendentes: number;
  valor_pendente: number;
  transacoes: number;
  ultima_transacao: string | null;
};

export type BankDashboardKpis = {
  saldo_total: number;
  total_receitas: number;
  total_despesas: number;
  valor_pendente: number;
  contas_ativas: number;
  transacoes: number;
};
