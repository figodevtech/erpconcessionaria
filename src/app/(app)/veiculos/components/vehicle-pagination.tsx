"use client"

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

export function VehiclePagination({ page, totalPages, setPage }: { page: number, totalPages: number, setPage: (p: number) => void }) {

  const handlePrevious = (e: React.MouseEvent) => {
    e.preventDefault()
    if (page > 1) setPage(page - 1)
  }

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault()
    if (page < totalPages) setPage(page + 1)
  }


  return (
    <Pagination className="justify-stretch">
      <PaginationContent className="w-full justify-between gap-2">
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={handlePrevious}
            text="Anterior"
            aria-disabled={page <= 1}
            className={`h-8 text-xs ${page <= 1 ? "pointer-events-none opacity-50" : ""}`}
          />
        </PaginationItem>
        <li className="flex items-center justify-center rounded-md bg-muted/60 px-3 text-xs font-medium text-muted-foreground">
          Página <span className="mx-1 text-foreground">{page}</span> de {totalPages}
        </li>
        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={handleNext}
            text="Próxima"
            aria-disabled={page >= totalPages}
            className={`h-8 text-xs ${page >= totalPages ? "pointer-events-none opacity-50" : ""}`}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
