"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import {
  BadgeCheck,
  Loader2,
  ReceiptText,
  User,
  Car,
  FileText,
  TrendingUp,
  Wallet,
  Clock,
  ChevronRight,
  XCircle,
  CreditCard,
  Calendar
} from "lucide-react"
import { getSaleByIdAction } from "@/actions/sales"
import { formatCurrency } from "@/lib/utils"
import { TransactionDialog } from "@/components/finance/transaction-dialog"
import { TransactionTable } from "@/components/finance/transaction-table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Transaction } from "@/lib/transactions"

interface SaleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  saleId: number | null
  onChanged?: () => void
}

type SaleDetails = {
  id: number
  status: string
  created_at: string
  total_value: number
  total_paid: number
  sub_total: number
  discount_type: string | null
  discount_value: number | null
  payment_method: string | null
  commission_percent_applied: number | null
  fiscal_observations: string | null
  customer?: {
    name?: string | null
    cpf_cnpj?: string | null
    email?: string | null
    phone?: string | null
  } | null
  vehicle?: {
    id?: number | null
    brand?: string | null
    model?: string | null
    plate?: string | null
    year_model?: string | number | null
    price?: number | null
    status?: string | null
  } | null
  seller?: {
    name?: string | null
    email?: string | null
  } | null
  transactions?: Transaction[]
}

export function SaleDialog({ open, onOpenChange, saleId, onChanged }: SaleDialogProps) {
  const [loading, setLoading] = useState(false)
  const [sale, setSale] = useState<SaleDetails | null>(null)
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false)

  const fetchSale = useCallback(async () => {
    if (!saleId) return

    setLoading(true)
    try {
      const result = await getSaleByIdAction(saleId)
      if (result.success) {
        setSale(result.data as SaleDetails)
      }
    } catch (error) {
      console.error("Error fetching sale:", error)
    } finally {
      setLoading(false)
    }
  }, [saleId])

  useEffect(() => {
    if (open) {
      fetchSale()
    }
  }, [open, fetchSale])

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "CONCLUIDA":
        return {
          color: "text-emerald-500",
          bg: "bg-emerald-500/10",
          border: "border-emerald-500/20",
          icon: <BadgeCheck className="h-4 w-4" />
        }
      case "PENDENTE":
        return {
          color: "text-amber-500",
          bg: "bg-amber-500/10",
          border: "border-amber-500/20",
          icon: <Clock className="h-4 w-4" />
        }
      case "CANCELADA":
        return {
          color: "text-destructive",
          bg: "bg-destructive/10",
          border: "border-destructive/20",
          icon: <XCircle className="h-4 w-4" />
        }
      default:
        return {
          color: "text-muted-foreground",
          bg: "bg-muted",
          border: "border-border",
          icon: <FileText className="h-4 w-4" />
        }
    }
  }

  const status = sale ? getStatusConfig(sale.status) : getStatusConfig("DEFAULT")

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col h-svh w-dvw max-w-dvw p-0 overflow-hidden sm:max-w-[1100px] sm:max-h-[min(90vh,850px)] sm:w-[95vw] border-none shadow-2xl rounded-[2.5rem] bg-background/95 backdrop-blur-2xl ring-1 ring-white/10">
        <DialogHeader className="p-8 pb-6 border-b border-white/5 bg-linear-to-b from-muted/50 to-transparent">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="p-3.5 rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/20 ring-1 ring-white/20">
                <TrendingUp className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <DialogTitle className="text-3xl font-black tracking-tighter uppercase italic">Venda #{saleId}</DialogTitle>
                  {sale && (
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${status.bg} ${status.color} ${status.border} text-[10px] font-black uppercase tracking-tighter`}>
                      {status.icon}
                      {sale.status}
                    </div>
                  )}
                </div>
                <DialogDescription className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  Registrada em {sale ? new Date(sale.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : '...'}
                </DialogDescription>
              </div>
            </div>

            {sale && (
              <div className="hidden md:flex items-center gap-8 px-8 py-4 bg-white/5 rounded-3xl border border-white/5">
                <div className="text-right">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total da Venda</p>
                  <p className="text-2xl font-black tracking-tighter text-primary">{formatCurrency(sale.total_value)}</p>
                </div>
                <div className="h-10 w-px bg-white/10" />
                <div className="text-right">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Recebido</p>
                  <p className="text-2xl font-black tracking-tighter text-emerald-500">{formatCurrency(sale.total_paid)}</p>
                </div>
              </div>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          {loading ? (
            <div className="flex h-96 items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <div className="absolute inset-0 h-12 w-12 animate-pulse bg-primary/20 blur-xl rounded-full" />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Sincronizando Dados...</p>
              </div>
            </div>
          ) : sale ? (
            <div className="p-8 space-y-12">
              {/* Grid Principal Assimétrico */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Coluna Esquerda (Maior): Informações da Transação */}
                <div className="lg:col-span-8 space-y-10">

                  {/* Seção Cliente & Veículo */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group p-6 rounded-[2rem] bg-muted/20 border border-white/5 hover:bg-muted/30 transition-all duration-500">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-xl bg-white/5 text-muted-foreground group-hover:text-primary transition-colors">
                          <User className="h-5 w-5" />
                        </div>
                        <h4 className="text-xs font-black uppercase tracking-[0.15em] text-muted-foreground">Comprador</h4>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-xl font-bold tracking-tight mb-0.5">{sale.customer?.name}</p>
                          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5">{sale.customer?.cpf_cnpj || "Sem Documento"}</span>
                          </p>
                        </div>
                        <div className="pt-4 border-t border-white/5 grid grid-cols-1 gap-2">
                          <div className="flex items-center justify-between text-xs font-medium">
                            <span className="text-muted-foreground">E-mail</span>
                            <span>{sale.customer?.email || "—"}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs font-medium">
                            <span className="text-muted-foreground">Telefone</span>
                            <span>{sale.customer?.phone || "—"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="group p-6 rounded-[2rem] bg-muted/20 border border-white/5 hover:bg-muted/30 transition-all duration-500">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-xl bg-white/5 text-muted-foreground group-hover:text-primary transition-colors">
                          <Car className="h-5 w-5" />
                        </div>
                        <h4 className="text-xs font-black uppercase tracking-[0.15em] text-muted-foreground">Patrimônio</h4>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-xl font-bold tracking-tight mb-0.5">{sale.vehicle?.brand} {sale.vehicle?.model}</p>
                          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/10 font-bold">{sale.vehicle?.plate}</span>
                            <span className="text-white/20">•</span>
                            <span>{sale.vehicle?.year_model}</span>
                          </p>
                        </div>
                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-muted-foreground">Preço Original</span>
                            <span className="text-sm font-bold">{formatCurrency(sale.vehicle?.price ?? 0)}</span>
                          </div>
                          <Badge variant="outline" className="rounded-lg border-white/10 bg-white/5 font-black text-[9px] uppercase tracking-tighter">
                            {sale.vehicle?.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Seção Detalhes da Venda */}
                  <div className="p-8 rounded-[2.5rem] bg-linear-to-br from-white/5 to-transparent border border-white/5">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <FileText className="h-5 w-5" />
                      </div>
                      <h4 className="text-xs font-black uppercase tracking-[0.15em] text-muted-foreground">Instrumento de Venda</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Vendedor Responsável</p>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary ring-2 ring-primary/10">
                            {sale.seller?.name?.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="text-sm font-bold">{sale.seller?.name || "N/A"}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Método Principal</p>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-primary" />
                          <span className="text-sm font-bold">{sale.payment_method || "Não Definido"}</span>
                        </div>
                      </div>
                      {/* <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Taxa de Comissão</p>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${sale.commission_percent_applied || 0}%` }}
                            />
                          </div>
                          <span className="text-sm font-black text-primary">{sale.commission_percent_applied ? `${sale.commission_percent_applied}%` : "0%"}</span>
                        </div>
                      </div> */}
                    </div>

                    {sale.fiscal_observations && (
                      <div className="mt-10 p-5 rounded-2xl bg-black/20 border border-white/5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5" />
                          Observações Fiscais
                        </p>
                        <p className="text-xs leading-relaxed text-muted-foreground/80 font-medium italic">
                          {sale.fiscal_observations}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Coluna Direita (Menor): Resumo Financeiro & Totais */}
                <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-0 h-fit self-start">
                  <div className="p-8 rounded-[2.5rem] bg-primary shadow-2xl shadow-primary/20 border border-white/10 relative overflow-hidden group">
                    {/* Efeito Visual de Fundo */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16 group-hover:bg-white/20 transition-all duration-700" />

                    <div className="relative z-10 space-y-8">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-black/20 text-white shadow-sm">
                          <Wallet className="h-5 w-5" />
                        </div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Resumo Financeiro</h4>
                      </div>

                      <div className="space-y-6">
                        <div className="flex justify-between items-end border-b border-white/10 pb-4">
                          <span className="text-[10px] font-black uppercase text-white/60 mb-1">Sub-Total</span>
                          <span className="text-xl font-bold text-white tracking-tighter">{formatCurrency(sale.sub_total)}</span>
                        </div>
                        <div className="flex justify-between items-end border-b border-white/10 pb-4 text-red-100">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-white/60 mb-1">Descontos</span>
                            <span className="text-[9px] font-medium text-white/40">{sale.discount_type === 'PERCENTUAL' ? 'Taxa Percentual' : 'Ajuste Fixo'}</span>
                          </div>
                          <span className="text-xl font-bold tracking-tighter">
                            {(sale.discount_value ?? 0) > 0 ? (
                              sale.discount_type === 'PERCENTUAL' ? `-${sale.discount_value}%` : `-${formatCurrency(sale.discount_value ?? 0)}`
                            ) : "—"}
                          </span>
                        </div>
                        <div className="pt-2">
                          <span className="text-[10px] font-black uppercase text-white/60 block mb-1">Total a Pagar</span>
                          <span className="text-4xl font-black text-white tracking-tighter drop-shadow-lg">{formatCurrency(sale.total_value)}</span>
                        </div>
                      </div>

                      <div className="pt-4 flex flex-col gap-3">
                        <div className="p-4 rounded-2xl bg-black/20 border border-white/10">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[9px] font-black uppercase text-white/50">Recebido</span>
                            <span className="text-sm font-black text-emerald-300">{Math.round((sale.total_paid / sale.total_value) * 100)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)] transition-all duration-1000"
                              style={{ width: `${(sale.total_paid / sale.total_value) * 100}%` }}
                            />
                          </div>
                          <p className="text-[10px] font-bold text-white/80 mt-2 text-right">{formatCurrency(sale.total_paid)}</p>
                        </div>

                        {sale.total_value - sale.total_paid > 0 && (
                          <div className="p-4 rounded-2xl bg-amber-500/20 border border-amber-500/30 animate-pulse">
                            <span className="text-[9px] font-black uppercase text-amber-200/70 block mb-1">Saldo Pendente</span>
                            <span className="text-xl font-black text-amber-300 tracking-tighter">{formatCurrency(sale.total_value - sale.total_paid)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-[2rem] bg-muted/10 border border-white/5 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <ReceiptText className="h-3.5 w-3.5" />
                      Próximas Etapas
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 text-[11px] font-medium">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Emissão de NF-e
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 text-[11px] font-medium">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Transferência de Propriedade
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 text-[11px] font-medium opacity-50">
                        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                        Liberação Física
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Histórico de Pagamentos (Full Width) */}
              <div className="space-y-6 pt-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <ReceiptText className="h-5 w-5" />
                    </div>
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Log de Transações</h4>
                  </div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase bg-white/5 px-3 py-1 rounded-full border border-white/5 tracking-tighter">
                    {sale.transactions?.length || 0} Registros Identificados
                  </p>
                </div>

                <div className="rounded-[2rem] border border-white/5 bg-black/10 overflow-hidden shadow-inner">
                  <TransactionTable
                    transactions={sale.transactions || []}
                    loading={false}
                    onChanged={() => fetchSale()}
                    compact
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-96 items-center justify-center">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Venda Não Localizada</p>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="p-8 border-t border-white/5 bg-linear-to-t from-muted/50 to-transparent gap-4">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-2xl px-10 font-bold hover:bg-white/5 active:scale-95 transition-all"
          >
            Fechar
          </Button>
          {sale?.status === 'PENDENTE' && (
            <Button
              onClick={() => setTransactionDialogOpen(true)}
              className="rounded-2xl px-10 font-black shadow-2xl shadow-primary/30 group active:scale-95 transition-all uppercase tracking-tighter text-xs"
            >
              Registrar Pagamento
              <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
    {sale && (
      <TransactionDialog
        open={transactionDialogOpen}
        onOpenChange={setTransactionDialogOpen}
        onSuccess={() => {
          setTransactionDialogOpen(false)
          fetchSale()
          onChanged?.()
        }}
        vehicle={{
          id: sale.vehicle?.id?.toString() ?? "",
          brand: sale.vehicle?.brand ?? "",
          model: sale.vehicle?.model ?? "",
          plate: sale.vehicle?.plate ?? "",
        }}
        saleId={sale.id}
        saleValue={Math.max(Number(sale.total_value ?? 0) - Number(sale.total_paid ?? 0), 0)}
      />
    )}
    </>
  )
}
