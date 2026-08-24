"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"

type VehicleFiltersProps = {
  search: string
  setSearch: (value: string) => void
  status: string
  setStatus: (value: string) => void
  setPage: (page: number) => void
}

export function VehicleFilters({ search, setSearch, status, setStatus, setPage }: VehicleFiltersProps) {

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1) // Reset to page 1 on filter
  }

  const handleStatusChange = (val: string | null) => {
    if (val) {
      setStatus(val)
      setPage(1) // Reset to page 1 on filter
    }
  }

  return (
    <section className="module-toolbar" aria-label="Filtros de veículos">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar marca, modelo, placa..."
              className="h-9 border-border/80 bg-background/80 pl-9 shadow-none sm:max-w-md"
              value={search}
              onChange={handleSearchChange}
            />
          </div>

          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="h-9 w-full border-border/80 bg-background/80 shadow-none sm:w-[190px]">
              <SelectValue placeholder="Filtrar por Status" />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} align="end">
              <SelectItem className="hover:cursor-pointer" value="Todos">Todos os Status</SelectItem>
              <SelectItem className="hover:cursor-pointer" value="Em venda">Em venda</SelectItem>
              <SelectItem className="hover:cursor-pointer" value="Repasse">Repasse</SelectItem>
              <SelectItem className="hover:cursor-pointer" value="Em breve">Em breve</SelectItem>
              <SelectItem className="hover:cursor-pointer" value="Vendido">Vendido</SelectItem>
              <SelectItem className="hover:cursor-pointer" value="Rascunho">Rascunho</SelectItem>
              <SelectItem className="hover:cursor-pointer" value="Pagamento">Pagamento</SelectItem>
            </SelectContent>
          </Select>
        </div>
    </section>
  )
}
