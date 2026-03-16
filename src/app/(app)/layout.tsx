import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { createClient } from "@/utils/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"
import { redirect } from "next/navigation"

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

  const mappedUser = user ? {
    nome: user.user_metadata?.full_name || user.email?.split('@')[0] || "Usuário",
    email: user.email || "",
  } : null

  return (
    <SidebarProvider>
      <AppSidebar user={mappedUser} />
      <SidebarInset className="flex min-h-screen min-w-0">
        <DashboardHeader />
        <div className="flex-1 overflow-auto p-4 lg:p-6 not-dark:bg-accent/50">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
