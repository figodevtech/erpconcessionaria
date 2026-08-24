"use client"

import type { ReactNode } from "react"
import { ModuleSurface } from "@/components/module/module-surface"
import { PieChart, Pie, Cell, LabelList } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart"

type StatusData = {
  name: string;
  value: number;
}

const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

const chartConfig = {
  "Em venda": {
    label: "Em venda",
    color: "var(--chart-1)",
  },
  "Repasse": {
    label: "Repasse",
    color: "var(--chart-2)",
  },
  "Em breve": {
    label: "Em breve",
    color: "var(--chart-3)",
  },
  "Vendido": {
    label: "Vendido",
    color: "var(--chart-4)",
  },
  "Rascunho": {
    label: "Rascunho",
    color: "var(--chart-5)",
  },
  "Pagamento": {
    label: "Pagamento",
    color: "var(--chart-4)",
  },
  "Indefinido": {
    label: "Indefinido",
    color: "var(--muted-foreground)",
  },

} satisfies ChartConfig

export function VehicleStatusChart({ data }: { data: StatusData[] }) {
  return (
    <ModuleSurface
      title="Status do Estoque"
      description="Distribuição de veículos por status"
    >
        <ChartContainer config={chartConfig} className="h-64 w-full lg:h-72">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="55%"
              outerRadius="80%"
              paddingAngle={4}
              strokeWidth={2}
              isAnimationActive
              animationDuration={600}
            >
              {data.map((item, index) => (
                <Cell
                  key={`${item.name}-${index}`}
                  fill={chartColors[index % chartColors.length]}
                  stroke="var(--card)"
                  className="transition-opacity hover:opacity-80"
                />
              ))}
              <LabelList
                dataKey="value"
                position="outside"
                fontSize={12}
                stroke="none"
                formatter={(value: ReactNode) => {
                  const numValue = typeof value === "number" || typeof value === "string"
                    ? Number(value)
                    : Number.NaN
                  return Number.isFinite(numValue) && numValue > 0 ? numValue : ""
                }}
                className="fill-foreground font-medium"
              />
            </Pie>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <ChartLegend
              className="mt-3 flex-wrap gap-x-3 gap-y-1 text-xs *:basis-auto *:justify-center"
              content={<ChartLegendContent nameKey="name" />}
              verticalAlign="bottom"
            />
          </PieChart>
        </ChartContainer>
    </ModuleSurface>
  )
}
