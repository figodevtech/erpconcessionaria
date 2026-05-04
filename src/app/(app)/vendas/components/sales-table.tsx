"use client"

import { useEffect, useState, useTransition, useCallback } from "react"
import { toast } from "sonner"
import { Car, Eye, MoreHorizontal, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { usePermissions } from "@/hooks/use-permissions"
import { listSalesAction, cancelVehicleSaleAction } from "@/actions/sales"
import { formatCurrency } from "@/lib/utils"
import { SalesPagination } from "./sales-pagination"
import { SaleDialog } from "./sale-dialog"
import { VehicleDialog } from "../../veiculos/components/vehicle-dialog"

interface Sale {
  id: number
  created_at: string
  total_value: number
  status: string
  customer: { name: string; cpf_cnpj: string }
  vehicle: { brand: string; model: string; plate: string; id: number }
  seller: { name: string }
}

export function SalesTable({
  search,
  status,
  page,
  setPage,
  onKpisShouldRefresh,
  onCountChange,
  onLoadingChange,
  refreshKey = 0,
}: {
  search: string
  status: string
  page: number
  setPage: (p: number) => void
  onKpisShouldRefresh?: () => void
  onCountChange?: (count: number) => void
  onLoadingChange?: (loading: boolean) => void
  refreshKey?: number
}) {
  const { hasPermission } = usePermissions()
  const [sales, setSales] = useState<Sale[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null)
  const [viewSaleId, setViewSaleId] = useState<number | null>(null)
  const [saleToCancel, setSaleToCancel] = useState<Sale | null>(null)

  const pageSize = 12

  const fetchData = useCallback(async () => {
    setLoading(true)
    onLoadingChange?.(true)
    const result = await listSalesAction({ page, pageSize, search, status })
    if (result.success) {
      setSales(result.data as Sale[])
      const total = result.count || 0
      setCount(total)
      onCountChange?.(total)
    } else {
      toast.error(result.error || "Erro ao carregar vendas")
    }
    setLoading(false)
    onLoadingChange?.(false)
  }, [page, search, status, onLoadingChange, onCountChange])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, [fetchData, refreshKey])

  const totalPages = Math.ceil(count / pageSize)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDENTE":
        return "bg-amber-500/10 text-amber-500"
      case "CONCLUIDA":
        return "bg-emerald-500/10 text-emerald-500"
      case "CANCELADA":
        return "bg-red-500/10 text-red-500"
      default:
        return "bg-gray-500/10 text-gray-500"
    }
  }

  const handleCancelSale = () => {
    if (!saleToCancel) return

    startTransition(async () => {
      const result = await cancelVehicleSaleAction(saleToCancel.id, saleToCancel.vehicle.id, true)
      if (result.success) {
        toast.success("Venda cancelada e veículo retornado ao estoque")
        setSaleToCancel(null)
        fetchData()
        if (onKpisShouldRefresh) onKpisShouldRefresh()
      } else {
        toast.error(result.error || "Erro ao cancelar venda")
      }
    })
  }

  return (
    <div className="relative min-h-[400px] w-full">
      <ScrollArea className="w-full">
        <div className="min-w-full p-4">

          <Table className="text-xs">
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[100px]">Data</TableHead>
                <TableHead className="min-w-[180px]">Cliente</TableHead>
                <TableHead className="min-w-[180px]">Veículo</TableHead>
                <TableHead className="min-w-[120px]">Vendedor</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Carregando vendas...
                  </TableCell>
                </TableRow>
              ) : sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Nenhuma venda encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                sales.map((sale) => (
                  <TableRow
                    key={sale.id}
                    className="h-14 hover:bg-muted/50 transition-colors cursor-pointer group"
                    onDoubleClick={() => setViewSaleId(sale.id)}
                  >
                    <TableCell className="text-muted-foreground font-medium">
                      {new Date(sale.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {sale.customer?.name || "N/A"}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {sale.customer?.cpf_cnpj || ""}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {sale.vehicle?.brand} {sale.vehicle?.model}
                      </div>
                      <div className="text-[10px] uppercase font-mono text-muted-foreground">
                        {sale.vehicle?.plate || "S/P"}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground italic">
                      {sale.seller?.name || "N/A"}
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {formatCurrency(sale.total_value)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={`border-transparent font-normal capitalize ${getStatusColor(sale.status)}`}
                      >
                        {sale.status.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="rounded-xl border-border text-nowrap w-min">
                          <DropdownMenuItem
                            onClick={() => setViewSaleId(sale.id)}
                            className="cursor-pointer font-semibold text-primary"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Visualizar Venda
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => setSelectedVehicle(sale.vehicle)}
                            className="cursor-pointer"
                          >
                            <Car className="mr-2 h-4 w-4" />
                            Visualizar Veículo
                          </DropdownMenuItem>
                          {sale.status !== "CANCELADA" && hasPermission("vehicles:delete") && (
                            <DropdownMenuItem
                              onClick={() => setSaleToCancel(sale)}
                              className="text-destructive focus:text-destructive cursor-pointer"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir Venda
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <div className="flex justify-end p-2">
        <SalesPagination
          page={page}
          totalPages={totalPages}
          setPage={setPage}
        />
      </div>

      <SaleDialog
        open={!!viewSaleId}
        onOpenChange={(open) => !open && setViewSaleId(null)}
        saleId={viewSaleId}
      />

      <VehicleDialog
        open={!!selectedVehicle}
        onOpenChange={(open) => !open && setSelectedVehicle(null)}
        vehicle={selectedVehicle}
        onSuccess={() => {
          fetchData()
          if (onKpisShouldRefresh) onKpisShouldRefresh()
        }}
      />

      <AlertDialog
        open={!!saleToCancel}
        onOpenChange={(open) => !open && setSaleToCancel(null)}
      >
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Venda?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá cancelar a venda do veículo{" "}
              <span className="font-bold text-foreground">
                {saleToCancel?.vehicle.brand} {saleToCancel?.vehicle.model}
              </span>.
              O veículo voltará ao estoque como &quot;Em venda&quot; e todos os pagamentos vinculados (se houver) serão cancelados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="mr-2" disabled={isPending} >Voltar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isPending}
              onClick={handleCancelSale}
            >
              {isPending ? "Processando..." : "Sim, Excluir Venda"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
