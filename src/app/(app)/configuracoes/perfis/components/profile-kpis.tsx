import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Lock, ShieldCheck, Zap } from "lucide-react"

export async function ProfileKPIs() {
  const supabase = await createClient()
  
  const { data: profiles } = await supabase.from("profiles").select("id")
  const { data: permissions } = await supabase.from("permissions").select("id")
  const { data: rolePerms } = await supabase.from("role_permissions").select("id")

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total de Perfis
          </CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{profiles?.length || 0}</div>
          <p className="text-xs text-muted-foreground">
            Cargos configurados
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Regras de Acesso
          </CardTitle>
          <Lock className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{permissions?.length || 0}</div>
          <p className="text-xs text-muted-foreground">
            Permissões granulares
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Associações
          </CardTitle>
          <ShieldCheck className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{rolePerms?.length || 0}</div>
          <p className="text-xs text-muted-foreground">
            Permissões atribuídas
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Módulos Ativos
          </CardTitle>
          <Zap className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">5</div>
          <p className="text-xs text-muted-foreground">
            Módulos monitorados
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
