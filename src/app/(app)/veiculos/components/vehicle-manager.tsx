"use client"

import { useState } from "react"
import { VehicleFilters } from "./vehicle-filters"
import { VehicleListClient } from "./vehicle-list-client"

export function VehicleManager({
  onKpisShouldRefresh,
}: {
  onKpisShouldRefresh?: () => void;
}) {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("Todos")
  const [page, setPage] = useState(1)

  return (
    <>
      <VehicleFilters
        search={search}
        setSearch={setSearch}
        status={status}
        setStatus={setStatus}
        setPage={setPage}
      />
      <VehicleListClient
        search={search}
        status={status}
        page={page}
        setPage={setPage}
        onKpisShouldRefresh={onKpisShouldRefresh}
      />
    </>
  )
}
