"use client"

import dynamic from "next/dynamic"

import { Skeleton } from "@/components/ui/skeleton"

function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="module-surface flex h-full min-h-[320px] flex-col gap-4 p-4 sm:p-5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-56" />
        <Skeleton className="flex-1" />
      </div>
    </div>
  )
}

// Recharts is the single heaviest dependency on this route. Splitting it out
// lets the header and the KPI cards paint while the chart bundle loads.
const VehicleBrandChart = dynamic(
  () => import("./vehicle-brand-chart").then((mod) => mod.VehicleBrandChart),
  { ssr: false, loading: () => <ChartSkeleton className="lg:col-span-2" /> },
)

const VehicleStatusChart = dynamic(
  () => import("./vehicle-status-chart").then((mod) => mod.VehicleStatusChart),
  { ssr: false, loading: () => <ChartSkeleton /> },
)

type DashboardChartsProps = {
  brandData: { brand: string; count: number }[]
  statusData: { name: string; value: number }[]
}

export function DashboardCharts({ brandData, statusData }: DashboardChartsProps) {
  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-3">
      <VehicleBrandChart data={brandData} />
      <VehicleStatusChart data={statusData} />
    </div>
  )
}
