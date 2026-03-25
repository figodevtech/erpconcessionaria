"use client"

import { useState, useTransition } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { updateRolePermissionsAction } from "@/actions/roles"
import { toast } from "sonner"

interface Permission {
  id: string
  module: string
  action: string
  slug: string
}

import { LayoutDashboard, DollarSign, Settings, Users, Car, Shield, Lock } from "lucide-react"

const MODULE_ICONS: Record<string, any> = {
  dashboard: LayoutDashboard,
  finance: DollarSign,
  financeiro: DollarSign,
  settings: Settings,
  configuracoes: Settings,
  users: Users,
  usuarios: Users,
  vehicles: Car,
  veiculos: Car,
}

export function ProfilePermissionsMatrix({
  perfilId,
  allPermissions,
  initialPermissionIds
}: {
  perfilId: number,
  allPermissions: Permission[],
  initialPermissionIds: string[]
}) {
  const [isPending, startTransition] = useTransition()
  const [selectedIds, setSelectedIds] = useState<string[]>(initialPermissionIds)

  // Group permissions by module
  const grouped = allPermissions.reduce((acc, curr) => {
    const mod = curr.module.toLowerCase()
    if (!acc[mod]) acc[mod] = []
    acc[mod].push(curr)
    return acc
  }, {} as Record<string, Permission[]>)

  const handleToggle = (permId: string, checked: boolean) => {
    const newSelectedIds = checked
      ? [...selectedIds, permId]
      : selectedIds.filter(id => id !== permId)

    const previousIds = [...selectedIds]
    setSelectedIds(newSelectedIds)

    startTransition(async () => {
      const result = await updateRolePermissionsAction(perfilId, newSelectedIds)
      if (result.success) {
        toast.success("Permissões atualizadas")
      } else {
        setSelectedIds(previousIds)
        toast.error("Erro ao atualizar: " + result.error)
      }
    })
  }

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()

  return (
    <div className="grid grid-cols-1 md:grid-cols-1 xl:grid-cols-2 gap-4 py-2">
      {Object.entries(grouped).map(([module, perms]) => {
        const Icon = MODULE_ICONS[module] || Shield
        return (
          <div key={module} className="flex flex-col rounded-2xl border bg-card/40 backdrop-blur-sm overflow-hidden border-primary/10 shadow-sm hover:border-primary/20 transition-all">
            <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 border-b">
              <div className="p-1.5 rounded-md bg-background border shadow-xs text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-xs uppercase tracking-tighter text-muted-foreground">
                {module === 'veiculos' ? 'Veículos' :
                  module === 'usuarios' ? 'Usuários' :
                    module === 'configuracoes' ? 'Configurações' :
                      capitalize(module)}
              </h3>
            </div>
            <div className="p-4 space-y-4 flex-1">
              {perms.map((perm) => (
                <div key={perm.id} className="flex items-center justify-between group">
                  <Label
                    htmlFor={`${perfilId}-${perm.id}`}
                    className="text-xs font-medium text-muted-foreground group-hover:text-foreground cursor-pointer transition-colors"
                  >
                    {capitalize(perm.action)}
                  </Label>
                  <Switch
                    id={`${perfilId}-${perm.id}`}
                    disabled={isPending}
                    className="scale-90"
                    checked={selectedIds.includes(perm.id)}
                    onCheckedChange={(checked) => handleToggle(perm.id, checked)}
                  />
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
