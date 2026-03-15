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
  value: {
    label: "Veículos",
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
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill="currentColor" stroke="oklch(0.623 0.214 259.815)" />
              ))}
            </Pie>
            <LabelList
              dataKey="value"
              position="outside"
              fontSize={12}
              stroke="none"
              formatter={(value: number) => (value > 0 ? value : "")}
              className="fill-foreground"
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <ChartLegend
              className="-translate-y-2 flex-wrap gap-2 text-xs *:basis-1/2 *:justify-center sm:*:basis-1/4"
              content={<ChartLegendContent nameKey="value" />} verticalAlign="bottom" />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
