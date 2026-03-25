import { ProfileKPIs } from "./components/profile-kpis"
import { ProfileManagerClient } from "./components/profile-manager-client"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export default async function ProfilesPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Perfis e Permissões</h1>
        <p className="text-muted-foreground">
          Configure as regras de acesso e permissões granulares para cada cargo.
        </p>
      </div>

      <Suspense fallback={<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div>}>
        <ProfileKPIs />
      </Suspense>

      <ProfileManagerClient />
    </div>
  )
}
