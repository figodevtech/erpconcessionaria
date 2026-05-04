"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"

interface SalesFiltersProps {
  search: string
  setSearch: (value: string) => void
  status: string
  setStatus: (value: string) => void
  setPage: (page: number) => void
}

export function SalesFilters({
  search,
  setSearch,
  status,
  setStatus,
  setPage,
}: SalesFiltersProps) {

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1)
  }

  const handleStatusChange = (val: string | null) => {
    if (val === null) return
    setStatus(val)
    setPage(1)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Filtros</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente ou veículo..."
              className="pl-9 h-10"
              value={search}
              onChange={handleSearchChange}
            />
          </div>

          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px] h-10">
              <SelectValue placeholder="Filtrar por Status" />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} align="end">
              <SelectItem className="hover:cursor-pointer" value="Todos">Todos os Status</SelectItem>
              <SelectItem className="hover:cursor-pointer" value="PENDENTE">Pendente</SelectItem>
              <SelectItem className="hover:cursor-pointer" value="CONCLUIDA">Concluída</SelectItem>
              <SelectItem className="hover:cursor-pointer" value="CANCELADA">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
