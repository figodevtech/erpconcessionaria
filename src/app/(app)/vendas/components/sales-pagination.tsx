"use client"

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

export function SalesPagination({ page, totalPages, setPage }: { page: number, totalPages: number, setPage: (p: number) => void }) {

  const handlePrevious = (e: React.MouseEvent) => {
    e.preventDefault()
    if (page > 1) setPage(page - 1)
  }

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault()
    if (page < totalPages) setPage(page + 1)
  }

  return (
    <Pagination className="justify-end">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={handlePrevious}
            className={page <= 1 ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
        <div className="flex items-center justify-center text-sm font-medium px-4">
          Página {page} de {totalPages}
        </div>
        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={handleNext}
            className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
