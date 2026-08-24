"use client"

import { useState, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import { VehicleTable } from "./vehicle-table"
import { VehiclePagination } from "./vehicle-pagination"
import { VehicleCard } from "./vehicle-card"
import { CarFront, ChevronDown, ListChecks, Loader2, Plus, LayoutGrid, List, RefreshCw, Tags } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { motion, AnimatePresence } from "framer-motion"
import { useLazyMount } from "@/hooks/use-lazy-mount"
import { usePermissions } from "@/hooks/use-permissions"
import type { VehicleStatus } from "@/lib/vehicle-status";

export type SellerType = "dealership" | "store" | "private";

export interface Vehicle {
  id: string;
  plate: string;
  chassi?: string | null;
  renavam?: string | null;
  brand: string;
  model: string;
  version: string;
  year: number;
  year_model: number;
  price: number;
  purchase_price?: number | null;
  total_receitas?: number;
  total_despesas?: number;
  lucro?: number;
  lucro_percentual?: number;
  fipe?: number | null;
  show_fipe_price?: boolean;
  mileage?: number | null;
  fuel: string;
  transmission: string;
  color: string;
  doors: number;
  body_type: string;
  image: string;
  city: string;
  state: string;
  seller: string;
  seller_type: SellerType;
  features: string[];
  description: string;
  enable_ai_description: boolean;
  ai_description?: string | null;
  engine_size?: string | null;
  horsepower?: number | null;
  is_new: boolean;
  featured: boolean;
  message?: string;
  created_at: string;
  status: VehicleStatus;
}

export interface VehicleImage {
  id: string;
  vehicle_id: number;
  image_url: string;
  sort_order: number;
  file_size?: number | null;
  mime_type?: string | null;
  width?: number | null;
  height?: number | null;
  created_at: string;
  updated_at: string;
  active: boolean;
}

export interface VehicleWithImages extends Vehicle {
  images: VehicleImage[];
}


// The vehicle form is by far the largest tree in the app; loading it only when
// the dialog is first opened keeps the module route light.
const VehicleDialog = dynamic(
  () => import("./vehicle-dialog").then((mod) => mod.VehicleDialog),
  { ssr: false },
)

const VehicleBulkStatusDialog = dynamic(
  () => import("./vehicle-bulk-status-dialog").then((mod) => mod.VehicleBulkStatusDialog),
  { ssr: false },
)

export type VehicleListClientProps = {
  search: string
  status: string
  page: number
  setPage: (p: number) => void
  onKpisShouldRefresh?: () => void
}

export function VehicleListClient({ search, status, page, setPage, onKpisShouldRefresh }: VehicleListClientProps) {
  const { hasPermission } = usePermissions()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showImages, setShowImages] = useState(false)
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [bulkMode, setBulkMode] = useState(false)
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<Set<string>>(new Set())
  const [isBulkStatusDialogOpen, setIsBulkStatusDialogOpen] = useState(false)

  const shouldMountVehicleDialog = useLazyMount(isDialogOpen)
  const shouldMountBulkStatusDialog = useLazyMount(isBulkStatusDialogOpen)

  const canCreateVehicles = hasPermission("vehicles:create")
  const canUpdateVehicles = hasPermission("vehicles:update")

  const handleCreateNew = () => {
    setSelectedVehicle(null)
    setIsDialogOpen(true)
  }

  const handleEditVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setIsDialogOpen(true)
  }

  const handleToggleBulkMode = () => {
    if (bulkMode) {
      setBulkMode(false)
      setSelectedVehicleIds(new Set())
      setIsBulkStatusDialogOpen(false)
      return
    }

    setViewMode("list")
    setBulkMode(true)
  }

  const handleToggleVehicle = (vehicleId: string, checked: boolean) => {
    setSelectedVehicleIds((current) => {
      const next = new Set(current)
      if (checked) next.add(vehicleId)
      else next.delete(vehicleId)
      return next
    })
  }

  const handleToggleVisibleVehicles = (checked: boolean) => {
    setSelectedVehicleIds((current) => {
      const next = new Set(current)
      vehicles.forEach((vehicle) => {
        if (checked) next.add(vehicle.id)
        else next.delete(vehicle.id)
      })
      return next
    })
  }

  const fetchVehicles = useCallback(async (newVehicle?: Vehicle) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/vehicles?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}&page=${page}&limit=30`)
      const data = await res.json()
      setVehicles(data.data || [])
      setTotalPages(data.meta?.totalPages || 1)
      setTotalItems(data.meta?.total || 0)

      // If a new vehicle was saved/updated, refresh the selected vehicle state
      if (newVehicle) {
        setSelectedVehicle(newVehicle)
        onKpisShouldRefresh?.()
      }
    } catch (error) {
      console.error("Failed to fetch vehicles:", error)
    } finally {
      setLoading(false)
    }
  }, [search, status, page, onKpisShouldRefresh])

  useEffect(() => {
    fetchVehicles()
  }, [fetchVehicles])

  const selectedVehicleIdList = Array.from(selectedVehicleIds)
  const allVisibleVehiclesSelected = vehicles.length > 0 && vehicles.every((vehicle) => selectedVehicleIds.has(vehicle.id))
  const someVisibleVehiclesSelected = vehicles.some((vehicle) => selectedVehicleIds.has(vehicle.id)) && !allVisibleVehiclesSelected

  const handleBulkStatusSuccess = () => {
    setSelectedVehicleIds(new Set())
    setBulkMode(false)
    fetchVehicles()
    onKpisShouldRefresh?.()
  }

  return (
    <section className="module-surface min-w-0 overflow-hidden">
      <header className="border-b border-border/70 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="module-card-title">Lista de Veículos</h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground ring-1 ring-inset ring-border/70">
                {totalItems} resultados
              </span>
              {bulkMode ? (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary ring-1 ring-inset ring-primary/15">
                  {selectedVehicleIds.size} selecionados
                </span>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => fetchVehicles()}
              disabled={loading}
              className="mt-1.5 inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
              <span>Recarregar dados</span>
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
            {viewMode === "list" && (
              <label className="flex min-h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-xs font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground">
                <span className="whitespace-nowrap">Exibir fotos</span>
                <Switch
                  checked={showImages}
                  onCheckedChange={setShowImages}
                  aria-label="Exibir fotos na lista"
                />
              </label>
            )}
            <div className="module-segmented-control" role="group" aria-label="Modo de visualização">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`module-segmented-item ${viewMode === "list" ? "module-segmented-item-active" : ""}`}
                title="Visualização em Lista"
                aria-pressed={viewMode === "list"}
              >
                <List className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                disabled={bulkMode}
                className={`module-segmented-item disabled:cursor-not-allowed disabled:opacity-40 ${viewMode === "grid" ? "module-segmented-item-active" : ""}`}
                title="Visualização em Grade"
                aria-pressed={viewMode === "grid"}
              >
                <LayoutGrid className="size-4" />
              </button>
            </div>

            {(canCreateVehicles || canUpdateVehicles) && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button size="sm" className="cursor-pointer text-xs shadow-sm">
                      Ações
                      <ChevronDown className="size-3.5" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="min-w-48">
                  {canCreateVehicles ? (
                    <DropdownMenuItem className="cursor-pointer" onClick={handleCreateNew}>
                      <Plus className="size-4" />
                      Novo Veículo
                    </DropdownMenuItem>
                  ) : null}
                  {canCreateVehicles && canUpdateVehicles ? <DropdownMenuSeparator /> : null}
                  {canUpdateVehicles ? (
                    <DropdownMenuItem className="cursor-pointer" onClick={handleToggleBulkMode}>
                      <ListChecks className="size-4" />
                      {bulkMode ? "Encerrar ações em massa" : "Ações em Massa"}
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {bulkMode && canUpdateVehicles ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={selectedVehicleIds.size === 0}
                      className="cursor-pointer text-xs"
                    >
                      Executar
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                        {selectedVehicleIds.size}
                      </span>
                      <ChevronDown className="size-3.5" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="min-w-44">
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => setIsBulkStatusDialogOpen(true)}
                  >
                    <Tags className="size-4" />
                    Alterar Status
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </div>
        {shouldMountVehicleDialog ? (
          <VehicleDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            vehicle={selectedVehicle}
            onSuccess={(v) => fetchVehicles(v)}
          />
        ) : null}
        {shouldMountBulkStatusDialog ? (
          <VehicleBulkStatusDialog
            open={isBulkStatusDialogOpen}
            onOpenChange={setIsBulkStatusDialogOpen}
            selectedVehicleIds={selectedVehicleIdList}
            onSuccess={handleBulkStatusSuccess}
          />
        ) : null}
      </header>
      <div className="relative min-h-[300px] min-w-0 overflow-hidden px-3 pb-3 pt-4 sm:px-5 sm:pb-4">
        <div
          className={`absolute inset-x-0 top-0 h-0.5 overflow-hidden bg-primary/15 transition-opacity ${loading ? "opacity-100" : "opacity-0"}`}
        >
          <div
            className={`absolute left-0 h-full w-1/2 -translate-x-full rounded-full bg-primary ${loading ? "animate-slideIn" : ""}`}
          />
        </div>

        <div className={`relative min-h-[320px] transition-opacity ${loading && vehicles.length > 0 ? "opacity-70" : "opacity-100"}`}>
          <AnimatePresence mode="wait">
            {viewMode === "list" && (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="w-full"
              >
                <div className="module-table-surface">
                  <VehicleTable
                    vehicles={vehicles}
                    loading={loading}
                    showImages={showImages}
                    bulkMode={bulkMode}
                    selectedVehicleIds={selectedVehicleIds}
                    allVisibleSelected={allVisibleVehiclesSelected}
                    someVisibleSelected={someVisibleVehiclesSelected}
                    onToggleVehicle={handleToggleVehicle}
                    onToggleVisible={handleToggleVisibleVehicles}
                    onEdit={handleEditVehicle}
                    onDeleteSuccess={() => {
                      fetchVehicles();
                      onKpisShouldRefresh?.();
                    }}
                  />
                </div>
              </motion.div>
            )}

            {viewMode === "grid" && (
              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="w-full"
              >
                <div className="grid grid-cols-1 gap-3 min-[430px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {loading && vehicles.length === 0 ? (
                    <div className="col-span-full flex min-h-64 w-full flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
                      <Loader2 className="size-5 animate-spin text-primary" />
                      <span>Carregando veículos...</span>
                    </div>
                  ) : vehicles.length === 0 ? (
                    <div className="col-span-full flex min-h-64 w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-6 text-center text-sm text-muted-foreground">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <CarFront className="size-5" />
                      </span>
                      <span>Nenhum veículo encontrado para a busca.</span>
                    </div>
                  ) : (
                    vehicles.map((vehicle: Vehicle) => (
                      <div key={vehicle.id} className="h-full">
                        <VehicleCard
                          vehicle={vehicle}
                          onEdit={handleEditVehicle}
                          onDeleteSuccess={() => {
                            fetchVehicles();
                            onKpisShouldRefresh?.();
                          }}
                        />
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-4 border-t border-border/70 pt-3">
          <VehiclePagination page={page} totalPages={totalPages} setPage={setPage} />
        </div>
      </div>
    </section>
  )
}
