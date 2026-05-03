"use client"

import { useState } from "react"
import { SalesFilters } from "./sales-filters"
import { SalesTable } from "./sales-table"

export function SalesManager({
  onKpisShouldRefresh,
}: {
  onKpisShouldRefresh?: () => void;
}) {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("Todos")
  const [page, setPage] = useState(1)

  return (
    <>
      <SalesFilters
        search={search}
        setSearch={setSearch}
        status={status}
        setStatus={setStatus}
        setPage={setPage}
      />
      <SalesTable
        search={search}
        status={status}
        page={page}
        setPage={setPage}
        onKpisShouldRefresh={onKpisShouldRefresh}
      />
    </>
  )
}
