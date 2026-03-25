"use client"

import { PermissionsContext } from "@/hooks/use-permissions"

interface PermissionsProviderProps {
  children: React.ReactNode
  permissions: string[]
}

/**
 * Provider to distribute permissions fetched in the layout to client components.
 */
export function PermissionsProvider({ 
  children, 
  permissions 
}: PermissionsProviderProps) {
  return (
    <PermissionsContext.Provider value={permissions}>
      {children}
    </PermissionsContext.Provider>
  )
}
