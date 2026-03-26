"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Lock, ShieldCheck, Zap } from "lucide-react"

interface ProfileKPIsProps {
  data: {
    totalProfiles: number
    totalPermissions: number
    avgPermissions: number
    assignedProfiles: number
  }
}

export function ProfileKPIs({ data }: ProfileKPIsProps) {
  const { totalProfiles, totalPermissions, avgPermissions, assignedProfiles } = data

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
          <div className="text-2xl font-bold">{totalProfiles}</div>
          <p className="text-xs text-muted-foreground">
            Cargos configurados
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
          <div className="text-2xl font-bold">{totalPermissions}</div>
          <p className="text-xs text-muted-foreground">
            Permissões atribuídas
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Média de Permissões
          </CardTitle>
          <Lock className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgPermissions}</div>
          <p className="text-xs text-muted-foreground">
            Por perfil configurado
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Perfis em Uso
          </CardTitle>
          <Zap className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{assignedProfiles}</div>
          <p className="text-xs text-muted-foreground">
            Vinculados a usuários
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
