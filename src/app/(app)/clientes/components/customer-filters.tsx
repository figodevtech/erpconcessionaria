"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type { CustomerPersonType, CustomerStatus } from "@/lib/customers";

type CustomerFiltersProps = {
  search: string;
  setSearch: (value: string) => void;
  status: "TODOS" | CustomerStatus;
  setStatus: (value: "TODOS" | CustomerStatus) => void;
  personType: "TODOS" | CustomerPersonType;
  setPersonType: (value: "TODOS" | CustomerPersonType) => void;
  setPage: (page: number) => void;
};

export function CustomerFilters({
  search,
  setSearch,
  status,
  setStatus,
  personType,
  setPersonType,
  setPage,
}: CustomerFiltersProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 md:flex-row md:items-center">
      <div className="relative min-w-0 flex-1">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Buscar por nome, documento, e-mail, telefone ou cidade..."
          className="pl-9"
        />
      </div>

      <Select
        value={status}
        onValueChange={(value) => {
          setStatus(value as "TODOS" | CustomerStatus);
          setPage(1);
        }}
      >
        <SelectTrigger className="w-full md:w-[170px]">
          <span>{status === "TODOS" ? "Todos os status" : status === "ATIVO" ? "Ativos" : "Inativos"}</span>
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectItem value="TODOS">Todos os status</SelectItem>
          <SelectItem value="ATIVO">Ativos</SelectItem>
          <SelectItem value="INATIVO">Inativos</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={personType}
        onValueChange={(value) => {
          setPersonType(value as "TODOS" | CustomerPersonType);
          setPage(1);
        }}
      >
        <SelectTrigger className="w-full md:w-[190px]">
          <span>
            {personType === "TODOS"
              ? "Todos os tipos"
              : personType === "PF"
                ? "Pessoa física"
                : "Pessoa jurídica"}
          </span>
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectItem value="TODOS">Todos os tipos</SelectItem>
          <SelectItem value="PF">Pessoa física</SelectItem>
          <SelectItem value="PJ">Pessoa jurídica</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
