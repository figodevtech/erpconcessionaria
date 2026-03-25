import { checkPermission } from "@/utils/permissions"
import { AccessDenied } from "@/components/access-denied"

export default async function ClientesPage() {
  const hasViewPermission = await checkPermission("customers:view")
  if (!hasViewPermission) return <AccessDenied />

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold tracking-tight">Clientes</h2>
      <p className="text-muted-foreground">Gerenciamento de clientes da concessionária.</p>
      {/* Content for Clientes will go here */}
    </div>
  )
}
