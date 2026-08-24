import { Skeleton } from "@/components/ui/skeleton"

function KpiSkeleton() {
  return (
    <div className="module-kpi">
      <div className="flex w-full flex-1 flex-col justify-between gap-3">
        <Skeleton className="h-3 w-28" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-3 w-36 max-w-full" />
        </div>
      </div>
      <Skeleton className="absolute right-3.5 top-3.5 size-8 rounded-lg sm:right-4 sm:top-4" />
    </div>
  )
}

/**
 * Shared loading boundary for every module.
 *
 * Besides the instant feedback on click, its presence is what allows Next to
 * prefetch the module routes: without a `loading` component anywhere in the
 * tree the router short-circuits prefetches and every navigation pays for the
 * full dynamic render.
 */
export default function ModuleLoading() {
  return (
    <div className="module-canvas" aria-busy="true" aria-label="Carregando módulo">
      <header className="px-1 sm:px-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-2 h-7 w-48" />
        <Skeleton className="mt-2 h-4 w-full max-w-md" />
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiSkeleton />
        <KpiSkeleton />
        <KpiSkeleton />
        <KpiSkeleton />
      </div>

      <section className="module-surface min-w-0 overflow-hidden">
        <header className="border-b border-border/70 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-9 w-full max-w-56" />
          </div>
        </header>
        <div className="flex flex-col gap-3 p-4 sm:p-5">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      </section>
    </div>
  )
}
