"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">Filtros</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar marca, modelo, placa..."
              className="pl-8"
              value={search}
              onChange={handleSearchChange}
            />
          </div>

          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por Status" />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} align="end">
              <SelectItem className="hover:cursor-pointer" value="Todos">Todos os Status</SelectItem>
              <SelectItem className="hover:cursor-pointer" value="Em venda">Em venda</SelectItem>
              <SelectItem className="hover:cursor-pointer" value="Em breve">Em breve</SelectItem>
              <SelectItem className="hover:cursor-pointer" value="Vendido">Vendido</SelectItem>
              <SelectItem className="hover:cursor-pointer" value="Rascunho">Rascunho</SelectItem>
              <SelectItem className="hover:cursor-pointer" value="Pagamento">Pagamento</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card >
  )
}
