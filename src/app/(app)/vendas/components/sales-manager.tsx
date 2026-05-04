"use client"

import { useState } from "react"
import { SalesFilters } from "./sales-filters"
import { SalesTable } from "./sales-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function SalesManager({
  onKpisShouldRefresh,
}: {
  onKpisShouldRefresh?: () => void;
}) {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("Todos")
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="flex flex-col gap-6">
      <SalesFilters
        search={search}
        setSearch={setSearch}
        status={status}
        setStatus={setStatus}
        setPage={setPage}
      />

      <Card>
        <CardHeader className="border-b-2 pb-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Lista de Vendas | <span className="text-muted-foreground font-normal font-mono">{totalCount} resultados</span></CardTitle>
              <CardDescription className="mt-1">
                <button
                  onClick={() => setRefreshKey(prev => prev + 1)}
                  disabled={loading}
                  className="inline-flex items-center gap-1 text-foreground/50 hover:text-foreground/70 hover:cursor-pointer disabled:opacity-50"
                >
                  <span>Recarregar</span>
                  <Loader2
                    width={12}
                    className={loading ? "animate-spin" : ""}
                  />
                </button>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative -mt-[24px] min-h-[300px] min-w-0 overflow-hidden px-4 pb-4 pt-6">
          <div
            className={`${loading ? "opacity-100" : "opacity-0"} transition-all h-0.5 bg-slate-400/20 w-full overflow-hidden absolute left-0 right-0 top-2`}
          >
            <div
              className={`w-1/2 bg-primary h-full absolute left-0 rounded-lg -translate-x-full ${loading ? "animate-slideIn" : ""}`}
            />
          </div>

          <div className="rounded-md border">
            <SalesTable
              search={search}
              status={status}
              page={page}
              setPage={setPage}
              onKpisShouldRefresh={onKpisShouldRefresh}
              onCountChange={setTotalCount}
              onLoadingChange={setLoading}
              refreshKey={refreshKey}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
