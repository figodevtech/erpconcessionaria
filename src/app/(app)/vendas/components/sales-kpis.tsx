"use client"

import { useEffect, useState } from "react"
import { getSalesKpisAction } from "@/actions/sales"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/utils"
import { BadgeCheck, Banknote, LayoutDashboard, ReceiptText } from "lucide-react"

interface SalesKpisData {
  totalSales: number
  completedRevenue: number
  pendingRevenue: number
  averageTicket: number
}

export function SalesKPIs({ refreshKey }: { refreshKey: number }) {
  const [data, setData] = useState<SalesKpisData | null>(null)

  useEffect(() => {
    async function loadData() {
      const result = await getSalesKpisAction()
      if (result.success && result.data) {
        setData(result.data)
      }
    }
    loadData()
  }, [refreshKey])

  if (!data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    )
  }

  const kpis = [
    {
      title: "Total de Vendas",
      value: data.totalSales.toString(),
      icon: LayoutDashboard,
      color: "text-primary",
      bg: "bg-primary/10",
      description: "Vendas ativas",
    },
    {
      title: "Receita Concluída",
      value: formatCurrency(data.completedRevenue),
      icon: BadgeCheck,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      description: "Valor já recebido",
    },
    {
      title: "Receita Pendente",
      value: formatCurrency(data.pendingRevenue),
      icon: ReceiptText,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      description: "Aguardando pagamento",
    },
    {
      title: "Ticket Médio",
      value: formatCurrency(data.averageTicket),
      icon: Banknote,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      description: "Valor médio por venda",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi, index) => (
        <Card key={index} className="rounded-xl border-none shadow-md overflow-hidden bg-card/60 backdrop-blur-sm relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <kpi.icon className={`w-16 h-16 ${kpi.color}`} />
          </div>
          <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  {kpi.title}
                </p>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-2xl font-bold tracking-tight">
                    {kpi.value}
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground">
                  {kpi.description}
                </p>
              </div>
              <div className={`p-2 rounded-lg ${kpi.bg}`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
