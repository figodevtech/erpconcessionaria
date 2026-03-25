import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { getMyPermissions } from "@/utils/permissions"
import { PermissionsProvider } from "@/components/permissions-provider"

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
    .select('name')
    .eq('id', user.id)
    .single()

  const permissions = await getMyPermissions()

  const mappedUser = {
    nome: profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || "Usuário",
    email: user.email || "",
  }

  return (
    <PermissionsProvider permissions={permissions}>
      <SidebarProvider>
        <AppSidebar user={mappedUser} permissions={permissions} />
        <SidebarInset>
          <DashboardHeader />
          <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </PermissionsProvider>
  )
}
