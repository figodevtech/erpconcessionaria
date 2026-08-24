import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { getAuthContext } from "@/utils/permissions"
import { PermissionsProvider } from "@/components/permissions-provider"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Single round trip: user, profile name, role and permissions come from the
  // same request-scoped cache the pages and server actions reuse.
  const { userId, email, name, permissions } = await getAuthContext()

  if (!userId) {
    redirect("/login")
  }

  const cookieStore = await cookies()
  const defaultSidebarOpen = cookieStore.get("sidebar_state")?.value !== "false"

  const mappedUser = {
    nome: name || email?.split('@')[0] || "Usuário",
    email: email || "",
  }

  return (
    <PermissionsProvider permissions={permissions}>
      <SidebarProvider defaultOpen={defaultSidebarOpen}>
        <AppSidebar user={mappedUser} permissions={permissions} />
        <SidebarInset className="min-w-0 overflow-hidden">
          <DashboardHeader />
          <main className="flex-1 min-w-0 overflow-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </PermissionsProvider>
  )
}
