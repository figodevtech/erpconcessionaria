"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, LabelList } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart"

type StatusData = {
  name: string;
  value: number;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--primary) / 0.8)',
  'hsl(var(--primary) / 0.6)',
  'hsl(var(--primary) / 0.4)',
  'hsl(var(--primary) / 0.2)',
];

const chartConfig = {
  "Em venda": {
    label: "Em venda",
    color: "hsl(var(--primary))",
  },
  "Repasse": {
    label: "Repasse",
    color: "hsl(var(--primary))",
  },
  "Vendido": {
    label: "Vendido",
    color: "hsl(var(--primary))",
  },
  "Rascunho": {
    label: "Rascunho",
    color: "hsl(var(--primary))",
  },
  "Pagamento": {
    label: "Pagamento",
    color: "hsl(var(--primary))",
  },

} satisfies ChartConfig

export function VehicleStatusChart({ data }: { data: StatusData[] }) {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Status do Estoque</CardTitle>
        <CardDescription>
          Distribuição de veículos por status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="w-full text-primary/30 h-52 sm:h-60 md:h-72">
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
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill="currentColor"
                  stroke="oklch(0.623 0.214 259.815)"
                  className="hover:opacity-80 transition-opacity"
                />
              ))}
              <LabelList
                dataKey="value"
                position="outside"
                fontSize={12}
                stroke="none"
                formatter={(value: any) => {
                  const numValue = Number(value);
                  return !isNaN(numValue) && numValue > 0 ? numValue : "";
                }}
                className="fill-foreground font-medium"
              />
            </Pie>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <ChartLegend
              className="text-foreground flex-wrap gap-2 text-xs *:basis-1/2 *:justify-center sm:*:basis-1/4 mt-4"
              content={<ChartLegendContent nameKey="" />}
              verticalAlign="bottom"
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
