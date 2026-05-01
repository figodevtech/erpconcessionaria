"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
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
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Shield, LayoutDashboard, DollarSign, Settings, Users, Car, CheckCircle2, LucideIcon } from "lucide-react"
import { createRoleAction } from "@/actions/roles"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface Permission {
  id: number;
  slug: string;
  module: string;
  action: string;
  description?: string;
}

const MODULE_ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  finance: DollarSign,
  financeiro: DollarSign,
  settings: Settings,
  configuracoes: Settings,
  users: Users,
  usuarios: Users,
  customers: Users,
  clientes: Users,
  vehicles: Car,
  veiculos: Car,
}

interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  allPermissions: Permission[]
  onSuccess: () => void
}

export function ProfileDialog({
  open,
  onOpenChange,
  allPermissions,
  onSuccess,
}: ProfileDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [selectedPerms, setSelectedPerms] = useState<string[]>([])

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
    },
  })

  // Group permissions by module for the second tab
  const grouped = allPermissions.reduce((acc, curr) => {
    const mod = curr.module.toLowerCase()
    if (!acc[mod]) acc[mod] = []
    acc[mod].push(curr)
    return acc
  }, {} as Record<string, Permission[]>)

  const handleTogglePerm = (slug: string, checked: boolean) => {
    if (checked) {
      setSelectedPerms([...selectedPerms, slug])
    } else {
      setSelectedPerms(selectedPerms.filter(s => s !== slug))
    }
  }
  async function onSubmit(data: { name: string; description: string }) {
    if (selectedPerms.length === 0) {
      toast.error("Selecione pelo menos uma permissão")
      return
    }

    startTransition(async () => {
      try {
        const result = await createRoleAction(data.name, data.description, selectedPerms)
        if (result.success) {
          toast.success("Perfil criado com sucesso")
          onSuccess()
          onOpenChange(false)
          form.reset()
          setSelectedPerms([])
        } else {
          toast.error("Erro: " + result.error)
        }
      } catch {
        toast.error("Erro inesperado ao criar perfil");
      }
    })
  }

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
  const moduleLabel = (module: string) => {
    if (module === "customers" || module === "clientes") return "Clientes";
    if (module === "veiculos") return "Veículos";
    if (module === "usuarios") return "Usuários";
    if (module === "configuracoes") return "Configurações";
    return capitalize(module);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col h-svh w-[100dvw] max-w-[100dvw] p-0 overflow-hidden sm:max-w-[1100px] sm:max-h-[min(90vh,850px)] sm:w-[95vw] border-none shadow-2xl">
        <DialogHeader className="shrink-0 px-8 py-6 border-b bg-card/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold tracking-tight">Novo Perfil de Acesso</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                Crie um novo cargo e defina as permissões granulares agora.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
            <Tabs defaultValue="basic" className="flex-1 flex flex-col overflow-hidden">
              <div className="px-8 pt-4 border-b bg-muted/20">
                <TabsList className="bg-transparent border-b-0 gap-6">
                  <TabsTrigger value="basic" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3 px-0 font-semibold transition-all">
                    Informações Básicas
                  </TabsTrigger>
                  <TabsTrigger value="permissions" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-3 px-0 font-semibold transition-all">
                    Definir Permissões ({selectedPerms.length})
                  </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="flex-1 overflow-y-auto">
                <TabsContent value="basic" className="p-8 space-y-6 m-0 focus-visible:ring-0">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Cargo</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Gerente Comercial" {...field} required />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição Curta</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descreva as responsabilidades deste cargo..."
                            className="resize-none h-24"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="permissions" className="p-8 m-0 focus-visible:ring-0 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(Object.entries(grouped) as [string, Permission[]][]).map(([module, perms]) => {
                      const Icon = MODULE_ICONS[module] || Shield
                      return (
                        <div key={module} className="flex flex-col rounded-xl border bg-muted/20 overflow-hidden shadow-sm">
                          <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 border-b">
                            <Icon className="h-3.5 w-3.5 text-primary" />
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                              {moduleLabel(module)}
                            </h4>
                          </div>
                          <div className="p-4 space-y-4">
                            {perms.map((perm) => (
                              <div key={perm.id} className="flex items-center justify-between group">
                                <Label htmlFor={`new-${perm.slug}`} className="text-xs font-medium cursor-pointer">
                                  {capitalize(perm.action)}
                                </Label>
                                <Switch
                                  id={`new-${perm.slug}`}
                                  checked={selectedPerms.includes(perm.slug)}
                                  onCheckedChange={(checked) => handleTogglePerm(perm.slug, checked)}
                                  className="scale-75"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>

            <DialogFooter className="shrink-0 px-8 py-4 border-t bg-card/50 backdrop-blur-md">
              <div className="flex w-full justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => onOpenChange(false)} className="rounded-xl px-6">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending} className="rounded-xl px-8 shadow-lg shadow-primary/20">
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  Finalizar e Criar Perfil
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
