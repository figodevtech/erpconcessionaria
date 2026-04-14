"use client"

import { useState, useEffect, useCallback } from "react"
import { VehicleTable } from "./vehicle-table"
import { VehiclePagination } from "./vehicle-pagination"
import { VehicleCard } from "./vehicle-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Plus, LayoutGrid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { motion, AnimatePresence } from "framer-motion"
import { VehicleDialog } from "./vehicle-dialog"
import { usePermissions } from "@/hooks/use-permissions"

export type SellerType = "dealership" | "store" | "private";
export type VehicleStatus = "Em venda" | "Em breve" | "Vendido" | "Rascunho" | "Pagamento";

export interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  version: string;
  year: number;
  year_model: number;
  price: number;
  fipe?: number | null;
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


export type VehicleListClientProps = {
  search: string
  status: string
  page: number
  setPage: (p: number) => void
}

export function VehicleListClient({ search, status, page, setPage }: VehicleListClientProps) {
  const { hasPermission } = usePermissions()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showImages, setShowImages] = useState(false)
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)

  const handleCreateNew = () => {
    setSelectedVehicle(null)
    setIsDialogOpen(true)
  }

  const handleEditVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setIsDialogOpen(true)
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
      }
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
            <CardTitle>Lista de Veículos | <span className="text-muted-foreground font-normal font-mono">{totalItems} resultados</span></CardTitle>
            <CardDescription className="mt-1">
              <button
                onClick={() => fetchVehicles()}
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
            {viewMode === "list" && (
              <div className="flex flex-row items-center justify-center gap-2 mr-4">
                <span className="text-sm font-medium">Exibir Fotos</span>
                <Switch
                  checked={showImages}
                  onCheckedChange={setShowImages}
                />
              </div>
            )}
            <div className="flex flex-row items-center justify-center p-1 bg-muted rounded-md mr-2">
              <button
                onClick={() => setViewMode("list")}
                className={`p-1 rounded-sm transition-all ${viewMode === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                title="Visualização em Lista"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1 rounded-sm transition-all ${viewMode === "grid" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                title="Visualização em Grade"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>

            {hasPermission("vehicles:create") && (
              <Button
                onClick={handleCreateNew}
                variant={"outline"}
                size={"sm"}
                className="cursor-pointer text-xs"
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Veículo
              </Button>
            )}
          </div>
        </div>
        <VehicleDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          vehicle={selectedVehicle}
          onSuccess={(v) => fetchVehicles(v)}
        />
      </CardHeader>
      <CardContent className="min-h-[300px] -mt-[24px] px-4 pb-4 pt-6 relative">
        <div
          className={`${loading && " opacity-100"
            } transition-all opacity-0 h-0.5 bg-slate-400 w-full overflow-hidden absolute left-0 right-0 top-2`}
        >
          <div
            className={`w-1/2 bg-primary h-full absolute left-0 rounded-lg -translate-x-full ${loading && "animate-slideIn "
              }`}
          />
        </div>

        <div className="relative min-h-[400px]">
          <AnimatePresence mode="wait">
            {viewMode === "list" && (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <div className="rounded-md border">
                  <VehicleTable
                    vehicles={vehicles}
                    loading={loading}
                    showImages={showImages}
                    onEdit={handleEditVehicle}
                    onDeleteSuccess={() => fetchVehicles()}
                  />
                </div>
              </motion.div>
            )}

            {viewMode === "grid" && (
              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                  {loading && vehicles.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-muted-foreground w-full">
                      Carregando veículos...
                    </div>
                  ) : vehicles.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-muted-foreground w-full">
                      Nenhum veículo encontrado para a busca.
                    </div>
                  ) : (
                    vehicles.map((vehicle: Vehicle) => (
                      <div key={vehicle.id} className="h-full">
                        <VehicleCard
                          vehicle={vehicle}
                          onEdit={handleEditVehicle}
                          onDeleteSuccess={() => fetchVehicles()}
                        />
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <VehiclePagination page={page} totalPages={totalPages} setPage={setPage} />
      </CardContent>
    </Card>
  )
}
