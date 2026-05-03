"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end">
      <div className="flex-1 space-y-1">
        <Label htmlFor="search" className="text-xs text-muted-foreground uppercase tracking-wider">Buscar Venda</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Buscar por cliente ou veículo..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1) // Reset page on search
            }}
            className="pl-9 bg-card border-border shadow-sm rounded-xl h-10"
          />
        </div>
      </div>
      
      <div className="w-full md:w-48 space-y-1">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Status</Label>
        <Select 
          value={status} 
          onValueChange={(val) => {
            setStatus(val)
            setPage(1)
          }}
        >
          <SelectTrigger className="bg-card border-border shadow-sm rounded-xl h-10">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectItem value="Todos">Todos</SelectItem>
            <SelectItem value="PENDENTE">Pendente</SelectItem>
            <SelectItem value="CONCLUIDA">Concluída</SelectItem>
            <SelectItem value="CANCELADA">Cancelada</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
