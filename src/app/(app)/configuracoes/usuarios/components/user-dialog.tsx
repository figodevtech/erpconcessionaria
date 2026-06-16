"use client"

import { useEffect, useTransition } from "react"
import { useForm, useWatch } from "react-hook-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { Loader2, User, Mail, Shield, CheckCircle2, LockKeyhole } from "lucide-react"
import { createUserAction } from "@/actions/users"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { usePermissions } from "@/hooks/use-permissions"

interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: UserProfile | null
  profiles: Profile[]
  onSuccess: () => void
}

interface Profile {
  id: number
  name: string
  description?: string
}

interface UserProfile {
  id: string
  email: string
  name: string
  profile_id: number
  commission_percent?: number | null
  profile?: {
    name: string
  }
}

type UserFormValues = {
  name: string
  email: string
  password: string
  profile_id: string
  commission_percent: string
}

export function UserDialog({
  open,
  onOpenChange,
  user,
  profiles,
  onSuccess,
}: UserDialogProps) {
  const { hasPermission } = usePermissions()
  const [isPending, startTransition] = useTransition()
  const isEditing = !!user
  const canManage = hasPermission(isEditing ? "settings:users:update" : "settings:users:create")

  const form = useForm<UserFormValues>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      profile_id: "",
      commission_percent: "",
    },
  })

  const selectedProfileId = useWatch({
    control: form.control,
    name: "profile_id",
  })

  useEffect(() => {
    if (open) {
      if (user) {
        form.reset({
          name: user.name || "",
          email: user.email || "",
          password: "", // Don't show password
          profile_id: user.profile_id?.toString() || "",
          commission_percent: user.commission_percent?.toString() || "",
        })
      } else {
        form.reset({
          name: "",
          email: "",
          password: "",
          profile_id: "",
          commission_percent: "",
        })
      }
    }
  }, [open, user, form])

  const selectedProfileName =
    profiles.find((profile) => profile.id.toString() === selectedProfileId)?.name ||
    user?.profile?.name ||
    ""

  async function onSubmit(data: UserFormValues) {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value as string)
    })

    if (isEditing) {
      formData.append("id", user.id)
    }

    startTransition(async () => {
      const result = await createUserAction(formData) // This handles both create and theoretically update if expanded
      if (result.success) {
        toast.success(isEditing ? "Usuário atualizado" : "Usuário criado")
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error("Erro: " + result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col h-svh w-[100dvw] max-w-[100dvw] p-0 overflow-hidden sm:max-w-[1100px] sm:max-h-[min(90vh,850px)] sm:w-[95vw] border-none shadow-2xl">
        <DialogHeader className="shrink-0 px-8 py-6 border-b bg-card/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <User className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold tracking-tight">
                {isEditing ? `Editar Usuário` : "Novo Usuário"}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                {isEditing
                  ? "Gerencie as informações e o nível de acesso deste colaborador."
                  : "Cadastre um novo colaborador preenchendo as informações abaixo."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 overflow-y-auto">
              <div className="p-8 space-y-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="João Silva" className="pl-9" {...field} required disabled={isPending || !canManage} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail Corporativo</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="joao@empresa.com"
                            className="pl-9"
                            {...field}
                            required
                            disabled={isEditing || isPending || !canManage}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isEditing ? "Nova Senha" : "Senha Temporária"}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <LockKeyhole className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="password"
                            placeholder={isEditing ? "Deixe em branco para manter" : "Mínimo 6 caracteres"}
                            className="pl-9"
                            {...field}
                            required={!isEditing}
                            minLength={field.value ? 6 : undefined}
                            disabled={isPending || !canManage}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* <FormField
                  control={form.control}
                  name="commission_percent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comissão de Venda (%)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Percent className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            placeholder="Ex: 5.5"
                            className="pl-9"
                            {...field}
                            disabled={isPending || !canManage}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                /> */}

                <FormField
                  control={form.control}
                  name="profile_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Perfil de Acesso</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={isPending || !canManage}>
                        <FormControl>
                          <SelectTrigger className="pl-9 relative">
                            <Shield className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <span className="flex flex-1 items-center text-left">
                              {selectedProfileName || "Selecione um cargo"}
                            </span>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent alignItemWithTrigger={false}>
                          {profiles.map((profile) => (
                            <SelectItem className={"hover:cursor-pointer"} key={profile.id} value={profile.id.toString()}>
                              {profile.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </ScrollArea>

            <DialogFooter className="shrink-0 px-8 py-4 border-t bg-card/50 backdrop-blur-md mt-auto">
              <div className="flex w-full justify-end gap-3 pb-4 pr-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending}
                  className="px-6 rounded-xl hover:bg-muted"
                >
                  Cancelar
                </Button>
                {canManage && (
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="px-8 rounded-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform"
                  >
                    {isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Salvar Usuário
                  </Button>
                )}
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
