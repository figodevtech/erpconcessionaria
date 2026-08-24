"use client"

import { useEffect, useState } from "react"
import { getSalesKpisAction } from "@/actions/sales"
import { ModuleKpi, ModuleKpiSkeleton } from "@/components/module/module-kpi"
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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <ModuleKpiSkeleton key={i} />
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
      description: "Vendas ativas",
    },
    {
      title: "Receita Concluída",
      value: formatCurrency(data.completedRevenue),
      icon: BadgeCheck,
      color: "text-emerald-500",
      description: "Valor já recebido",
    },
    {
      title: "Receita Pendente",
      value: formatCurrency(data.pendingRevenue),
      icon: ReceiptText,
      color: "text-amber-500",
      description: "Aguardando pagamento",
    },
    {
      title: "Ticket Médio",
      value: formatCurrency(data.averageTicket),
      icon: Banknote,
      color: "text-blue-500",
      description: "Valor médio por venda",
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <ModuleKpi
          key={kpi.title}
          label={kpi.title}
          value={kpi.value}
          description={kpi.description}
          icon={kpi.icon}
          iconClassName={kpi.color}
        />
      ))}
    </div>
  )
}
