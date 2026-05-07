"use server";

import { createClient } from "@/utils/supabase/server";
import { checkPermission } from "@/utils/permissions";
import type { BankAccountSummary, BankDashboardKpis } from "@/lib/banks";
import type { BankAccount } from "@/lib/type-catalog";
import type { TransactionType } from "@/lib/transactions";

type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

type BankFilters = {
  search?: string;
  status?: "TODOS" | "ATIVO" | "INATIVO";
};

type TransactionRow = {
  banco_id: number | null;
  tipo: TransactionType;
  valor: number | string | null;
  pendente: boolean;
  data: string | null;
};

function summarizeBank(bank: BankAccount, transactions: TransactionRow[]): BankAccountSummary {
  const bankTransactions = transactions.filter((transaction) => transaction.banco_id === bank.id);
  const confirmed = bankTransactions.filter((transaction) => !transaction.pendente);
  const pending = bankTransactions.filter((transaction) => transaction.pendente);

  const totalReceitas = confirmed
    .filter((transaction) => transaction.tipo === "RECEITA")
    .reduce((acc, transaction) => acc + Number(transaction.valor ?? 0), 0);
  const totalDespesas = confirmed
    .filter((transaction) => transaction.tipo === "DESPESA")
    .reduce((acc, transaction) => acc + Number(transaction.valor ?? 0), 0);
  const valorPendente = pending.reduce((acc, transaction) => acc + Number(transaction.valor ?? 0), 0);
  const ultimaTransacao = bankTransactions
    .map((transaction) => transaction.data)
    .filter(Boolean)
    .sort()
    .at(-1) ?? null;

  return {
    ...bank,
    saldo_atual: bank.valor_inicial + totalReceitas - totalDespesas,
    total_receitas: totalReceitas,
    total_despesas: totalDespesas,
    pendentes: pending.length,
    valor_pendente: valorPendente,
    transacoes: bankTransactions.length,
    ultima_transacao: ultimaTransacao,
  };
}

function getKpis(banks: BankAccountSummary[]): BankDashboardKpis {
  return banks.reduce(
    (acc, bank) => ({
      saldo_total: acc.saldo_total + bank.saldo_atual,
      total_receitas: acc.total_receitas + bank.total_receitas,
      total_despesas: acc.total_despesas + bank.total_despesas,
      valor_pendente: acc.valor_pendente + bank.valor_pendente,
      contas_ativas: acc.contas_ativas + (bank.ativo ? 1 : 0),
      transacoes: acc.transacoes + bank.transacoes,
    }),
    {
      saldo_total: 0,
      total_receitas: 0,
      total_despesas: 0,
      valor_pendente: 0,
      contas_ativas: 0,
      transacoes: 0,
    },
  );
}

export async function listBankAccountsDashboardAction(
  filters: BankFilters = {},
): Promise<ActionResult<{ banks: BankAccountSummary[]; kpis: BankDashboardKpis }>> {
  const canView = await checkPermission("finance:view");
  if (!canView) {
    return { success: false, error: "Voce nao tem permissao para visualizar bancos." };
  }

  const supabase = await createClient();
  let bankQuery = supabase
    .from("bank_accounts")
    .select("*")
    .order("ativo", { ascending: false })
    .order("titulo", { ascending: true });

  if (filters.status === "ATIVO") bankQuery = bankQuery.eq("ativo", true);
  if (filters.status === "INATIVO") bankQuery = bankQuery.eq("ativo", false);

  if (filters.search?.trim()) {
    const search = filters.search.trim();
    bankQuery = bankQuery.or(
      `titulo.ilike.%${search}%,agencia.ilike.%${search}%,conta_numero.ilike.%${search}%,proprietario.ilike.%${search}%`,
    );
  }

  const [banksResult, transactionsResult] = await Promise.all([
    bankQuery,
    supabase
      .from("transactions")
      .select("banco_id, tipo, valor, pendente, data")
      .eq("is_deleted", false)
      .not("banco_id", "is", null),
  ]);

  if (banksResult.error) return { success: false, error: banksResult.error.message };
  if (transactionsResult.error) return { success: false, error: transactionsResult.error.message };

  const bankAccounts = (banksResult.data ?? []).map((bank) => ({
    ...(bank as BankAccount),
    valor_inicial: Number(bank.valor_inicial ?? 0),
  }));
  const transactions = (transactionsResult.data ?? []) as TransactionRow[];
  const banks = bankAccounts.map((bank) => summarizeBank(bank, transactions));

  return {
    success: true,
    data: {
      banks,
      kpis: getKpis(banks),
    },
  };
}
