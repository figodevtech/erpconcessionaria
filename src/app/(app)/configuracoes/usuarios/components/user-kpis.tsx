import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, Shield, UserMinus } from "lucide-react"

export async function UserKPIs() {
  const supabase = await createClient()
  
  const { data: usersData } = await supabase
    .from("users")
    .select("active, profile_id")

  const users = usersData || []
  
  const totalUsers = users.length
  const activeUsers = users.filter(u => u.active).length
  const inactiveUsers = totalUsers - activeUsers
  
  // Count unique profile_ids
  const uniqueProfiles = new Set(users.map(u => u.profile_id)).size

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total de Usuários
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalUsers}</div>
          <p className="text-xs text-muted-foreground">
            Colaboradores cadastrados
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Ativos
          </CardTitle>
          <UserCheck className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeUsers}</div>
          <p className="text-xs text-muted-foreground">
            Acesso liberado
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Perfis em Uso
          </CardTitle>
          <Shield className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{uniqueProfiles}</div>
          <p className="text-xs text-muted-foreground">
            Cargos diferentes
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Inativos
          </CardTitle>
          <UserMinus className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{inactiveUsers}</div>
          <p className="text-xs text-muted-foreground">
            Acesso bloqueado
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
