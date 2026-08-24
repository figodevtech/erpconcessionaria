"use client"

import { ModuleSurface } from "@/components/module/module-surface"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"

type BrandData = {
  brand: string;
  count: number;
}

const chartConfig = {
  count: {
    label: "Veículos",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function VehicleBrandChart({ data }: { data: BrandData[] }) {
  const minimumChartWidth = Math.max(640, data.length * 86)

  return (
    <ModuleSurface
      title="Veículos por Marca"
      description="Quantidade de veículos disponíveis por fabricante"
      className="lg:col-span-2"
    >
      <div
        role="region"
        aria-label="Gráfico de veículos por marca com rolagem horizontal"
        tabIndex={0}
        className="w-full overflow-x-auto overscroll-x-contain pb-2 outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <ChartContainer
          config={chartConfig}
          className="h-56 w-full max-w-none aspect-auto sm:h-64 lg:h-72"
          style={{ minWidth: `${minimumChartWidth}px` }}
        >
          <BarChart
            data={data}
            margin={{
              top: 8,
              right: 8,
              left: -12,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="brand"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={30}
            />
            <ChartTooltip
              cursor={{ fill: "var(--muted)" }}
              content={<ChartTooltipContent />}
            />
            <Bar
              dataKey="count"
              fill="var(--color-count)"
              radius={[5, 5, 1, 1]}
              maxBarSize={46}
              isAnimationActive
              animationDuration={700}
            />
          </BarChart>
        </ChartContainer>
      </div>
    </ModuleSurface>
  )
}
