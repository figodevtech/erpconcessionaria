"use client"

import { useState, useEffect, useCallback } from "react"
import { listUsersAction, deleteUserAction } from "@/actions/users"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, User, Edit, Trash2, Loader2, UserPlus } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { UserFilters } from "./user-filters"
import { UserDialog } from "./user-dialog"
import { VehiclePagination } from "@/app/(app)/veiculos/components/vehicle-pagination"

export function UserManagerClient({ initialProfiles }: { initialProfiles: any[] }) {
  const [users, setUsers] = useState<any[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 10

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<any | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    const result = await listUsersAction({ page, pageSize, search })
    if (result.success) {
      setUsers(result.data || [])
      setCount(result.count || 0)
    } else {
      toast.error("Erro ao carregar usuários")
    }
    setLoading(false)
  }, [page, search])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleEdit = (user: any) => {
    setSelectedUser(user)
    setDialogOpen(true)
  }

  const handleNew = () => {
    setSelectedUser(null)
    setDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!userToDelete) return
    setIsDeleting(true)
    const result = await deleteUserAction(userToDelete.id)
    if (result.success) {
      toast.success("Usuário excluído")
      loadUsers()
    } else {
      toast.error("Erro ao excluir: " + result.error)
    }
    setIsDeleting(false)
    setDeleteAlertOpen(false)
    setUserToDelete(null)
  }

  const totalPages = Math.ceil(count / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Lista de Usuários</h2>
        <Button onClick={handleNew} size="sm" className="rounded-xl shadow-lg">
          <UserPlus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      <UserFilters search={search} setSearch={setSearch} setPage={setPage} />

      <div className="rounded-xl border bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden relative min-h-[400px]">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-[2px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        
        <Table className="text-xs">
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-muted/30">
              <TableHead className="w-[80px]">Avatar</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead className="text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length > 0 ? (
              users.map((user) => (
                <TableRow 
                  key={user.id} 
                  className="h-14 cursor-pointer hover:bg-muted/50 transition-colors"
                  onDoubleClick={() => handleEdit(user)}
                >
                  <TableCell>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <User className="h-4 w-4" />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-sm">
                    {user.name || "Sem Nome"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal border-primary/20 bg-primary/5 text-primary">
                      {user.profile?.name || "Sem Perfil"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      } />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(user)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            setUserToDelete(user)
                            setDeleteAlertOpen(true)
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : !loading && (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <VehiclePagination page={page} totalPages={totalPages} setPage={setPage} />
      )}

      <UserDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        user={selectedUser} 
        profiles={initialProfiles}
        onSuccess={loadUsers}
      />

      <AlertDialog 
        open={deleteAlertOpen} 
        onOpenChange={(open) => {
          setDeleteAlertOpen(open)
          if (!open) setUserToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá o acesso de <strong>{userToDelete?.name || userToDelete?.email}</strong> permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} type="button">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar Exclusão"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
