import { listUsersAction } from "@/actions/users"
import { getRolesAction } from "@/actions/roles"
import { UserKPIs } from "./components/user-kpis"
import { UserManagerClient } from "./components/user-manager-client"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export default async function UsersPage() {
  const { data: roles } = await getRolesAction()

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gestão de Usuários</h1>
        <p className="text-muted-foreground">
          Gerencie os colaboradores da plataforma e seus níveis de acesso.
        </p>
      </div>

      <Suspense fallback={<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div>}>
        <UserKPIs />
      </Suspense>

      <UserManagerClient initialProfiles={roles || []} />
    </div>
  )
}
