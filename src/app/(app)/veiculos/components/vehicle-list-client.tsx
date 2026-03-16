"use client"

import { useState, useEffect, useCallback } from "react"
import { VehicleTable } from "./vehicle-table"
import { VehiclePagination } from "./vehicle-pagination"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

export type Vehicle = {
  id: string
  brand: string
  model: string
  version: string
  image: string
  year: number
  price: number
  status: string
  plate: string
  created_at: string
}

export type VehicleListClientProps = {
  search: string
  status: string
  page: number
  setPage: (p: number) => void
}

export function VehicleListClient({ search, status, page, setPage }: VehicleListClientProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [showImages, setShowImages] = useState(false)

  const fetchVehicles = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/vehicles?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}&page=${page}&limit=10`)
      const data = await res.json()
      setVehicles(data.data || [])
      setTotalPages(data.meta?.totalPages || 1)
    } catch (error) {
      console.error("Failed to fetch vehicles:", error)
    } finally {
      setLoading(false)
    }
  }, [search, status, page])

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchVehicles()
    }, 300)

    return () => clearTimeout(timeout)
  }, [fetchVehicles])

  return (
    <Card>
      <CardHeader className="border-b-2 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Lista de Veículos | <span className="text-muted-foreground font-normal font-mono">{vehicles.length} resultados</span></CardTitle>
            <CardDescription className="mt-1">
              <button
                onClick={fetchVehicles}
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
          <div className="flex items-center gap-2">
            <div className="flex flex-row items-center justify-center gap-2 mr-8">
              <span>Exibir Fotos</span>
              <Switch
                checked={showImages}
                onCheckedChange={setShowImages}
              />
            </div>
            <Button
              onClick={() => { }}
              variant={"outline"}
              size={"sm"}
              className="cursor-pointer text-xs"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Veículo
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="min-h-[300px] -mt-[24px] px-4 pb-4 pt-6 relative">
        <div
          className={`${loading && " opacity-100"
            } transition-all opacity-0 h-0.5 bg-slate-400 w-full overflow-hidden absolute left-0 right-0 top-2`}
        >
          <div
            className={`w-1/2 bg-primary h-full absolute left-0 rounded-lg -translate-x-[100%] ${loading && "animate-slideIn "
              }`}
          />
        </div>
        <div className="rounded-md border">
          <VehicleTable vehicles={vehicles} loading={loading} showImages={showImages} />
        </div>
        <VehiclePagination page={page} totalPages={totalPages} setPage={setPage} />
      </CardContent>
    </Card>
  )
}
