import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { DashboardHeader } from "@/components/dashboard-header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*, profile:profiles(name, role_permissions(permission:permissions(slug)))')
    .eq('id', user.id)
    .single()

  const permissions = (profile as any)?.profile?.role_permissions?.map((p: any) => p.permission.slug) || []

  const mappedUser = user ? {
    nome: profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || "Usuário",
    email: user.email || "",
  } : { nome: "Convidado", email: "" }

  return (
    <SidebarProvider>
      <AppSidebar user={mappedUser} permissions={permissions} />
      <SidebarInset>
        <DashboardHeader />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
