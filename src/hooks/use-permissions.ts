"use client"

import { createContext, useContext } from "react"

export const PermissionsContext = createContext<string[]>([])

/**
 * Hook to check for permissions in client components.
 */
export function usePermissions() {
  const permissions = useContext(PermissionsContext)
  
  /**
   * Check if the user has a specific permission.
   * If the user has 'admin' permission, it returns true for any check.
   */
  const hasPermission = (permission: string) => {
    if (!permissions) return false
    return permissions.includes(permission) || permissions.includes("admin")
  }
  
  /**
   * Check if the user has all the specified permissions.
   */
  const hasAllPermissions = (perms: string[]) => {
    return perms.every(p => hasPermission(p))
  }
  
  /**
   * Check if the user has at least one of the specified permissions.
   */
  const hasAnyPermission = (perms: string[]) => {
    return perms.some(p => hasPermission(p))
  }

  return { 
    permissions: permissions || [], 
    hasPermission, 
    hasAllPermissions, 
    hasAnyPermission 
  }
}
