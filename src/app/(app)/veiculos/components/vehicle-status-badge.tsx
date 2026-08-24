import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const statusStyles: Record<string, string> = {
  "Em venda": "bg-primary/10 text-primary ring-primary/15",
  Repasse: "bg-orange-500/10 text-orange-700 ring-orange-500/15 dark:text-orange-300",
  "Em breve": "bg-fuchsia-500/10 text-fuchsia-700 ring-fuchsia-500/15 dark:text-fuchsia-300",
  Vendido: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/15 dark:text-emerald-300",
  Rascunho: "bg-slate-500/10 text-slate-600 ring-slate-500/15 dark:text-slate-300",
  Pagamento: "bg-amber-500/10 text-amber-700 ring-amber-500/15 dark:text-amber-300",
}

export function VehicleStatusBadge({
  status,
  className,
}: {
  status?: string | null
  className?: string
}) {
  const label = status || "Indefinido"

  return (
    <Badge
      variant="outline"
      className={cn(
        "border-0 px-2.5 font-medium ring-1 ring-inset",
        statusStyles[label] ?? "bg-muted text-muted-foreground ring-border",
        className,
      )}
    >
      {label}
    </Badge>
  )
}
