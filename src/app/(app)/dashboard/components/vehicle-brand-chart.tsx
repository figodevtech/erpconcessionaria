"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"

type BrandData = {
  brand: string;
  count: number;
}

const chartConfig = {
  count: {
    label: "Veículos",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export function VehicleBrandChart({ data }: { data: BrandData[] }) {
  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle>Veículos por Marca</CardTitle>
        <CardDescription>
          Quantidade de veículos disponíveis por fabricante
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-48 text-primary/30 xs:h-56 sm:h-64 md:h-72">
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid className="text-foreground" strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis className="text-foreground"
              dataKey="brand"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis className="text-foreground"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={30}
            />
            <ChartTooltip
              cursor={{ fill: "hsl(var(--muted) / 0.5)" }}
              content={<ChartTooltipContent />}
            />
            <Bar
              dataKey="count"
              stroke="oklch(0.623 0.214 259.815)"
              strokeWidth={2}
              fill="currentColor"
              radius={[6, 6, 0, 0]}
              isAnimationActive
              animationDuration={700}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
