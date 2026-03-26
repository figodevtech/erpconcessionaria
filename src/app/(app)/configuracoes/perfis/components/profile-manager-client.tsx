"use client";

import { useState } from "react";
import { deleteRoleAction } from "@/actions/roles";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Shield,
  Edit,
  Loader2,
  ShieldCheck,
  Lock,
  Trash2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ProfilePermissionsMatrix } from "./profile-permissions-matrix";
import { VehiclePagination } from "@/app/(app)/veiculos/components/vehicle-pagination";
import { ProfileDialog } from "./profile-dialog";
import { usePermissions } from "@/hooks/use-permissions";

interface Permission {
  id: number;
  slug: string;
  module: string;
  action: string;
  description?: string;
}

interface Profile {
  id: number;
  name: string;
  description?: string;
  role_permissions?: { permission_slug: string }[];
}

interface ProfileManagerClientProps {
  profiles: Profile[]
  loading: boolean
  onSuccess: () => void
  page: number
  setPage: (p: number) => void
  count: number
  pageSize: number
  allPermissions: Permission[]
}

export function ProfileManagerClient({
  profiles,
  loading,
  onSuccess,
  page,
  setPage,
  count,
  pageSize,
  allPermissions
}: ProfileManagerClientProps) {
  const { hasPermission } = usePermissions();
  const [isDeleting, setIsDeleting] = useState(false);

  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<Profile | null>(null);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);

  const handleDelete = async () => {
    if (!profileToDelete) return;
    setIsDeleting(true);
    try {
      const result = await deleteRoleAction(profileToDelete.id);
      if (result.success) {
        toast.success("Perfil excluído com sucesso");
        setDeleteAlertOpen(false);
        setProfileToDelete(null);
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch (e) {
      toast.error("Erro inesperado ao excluir perfil");
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPages = Math.ceil(count / pageSize);

  return (
    <div className="space-y-6">
      <Table className="text-xs">
        <TableHeader>
          <TableRow className="hover:bg-transparent bg-muted/30">
            <TableHead className="w-[80px]">Ícone</TableHead>
            <TableHead>Nome do Perfil</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="text-center w-[150px]">Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.length > 0
            ? profiles.map((profile) => (
              <TableRow
                key={profile.id}
                className="h-14 cursor-pointer hover:bg-muted/50 transition-colors"
                onDoubleClick={() => setEditingProfile(profile)}
              >
                <TableCell>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Shield className="h-4 w-4" />
                  </div>
                </TableCell>
                <TableCell className="font-semibold text-sm">
                  {profile.name}
                </TableCell>
                <TableCell className="text-muted-foreground italic">
                  {profile.description || "Cargo operacional do ERP"}
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-600 border border-green-500/20">
                    <ShieldCheck className="h-3 w-3" />
                    {profile.role_permissions?.length || 0} Permissões
                  </span>
                </TableCell>
                <TableCell
                  className="text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger className="p-2 hover:cursor-pointer rounded-md hover:bg-muted-foreground/20 transition-colors">
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-48 rounded-xl p-2 shadow-xl border-primary/10"
                    >
                      <DropdownMenuItem
                        className="rounded-lg cursor-pointer py-2"
                        onClick={() => setEditingProfile(profile)}
                      >
                        <Edit className="mr-2 h-4 w-4 text-primary" />
                        Configurar Acesso
                      </DropdownMenuItem>
                      {hasPermission("settings:profiles:delete") && (
                        <DropdownMenuItem
                          className="rounded-lg cursor-pointer py-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                          onClick={() => {
                            setProfileToDelete(profile);
                            setDeleteAlertOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir Perfil
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
            : !loading && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-32 text-center text-muted-foreground"
                >
                  Nenhum perfil localizado.
                </TableCell>
              </TableRow>
            )}
        </TableBody>
      </Table>


      {totalPages > 1 && (
        <VehiclePagination
          page={page}
          totalPages={totalPages}
          setPage={setPage}
        />
      )}

      <ProfileDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        allPermissions={allPermissions}
        onSuccess={onSuccess}
      />

      {/* Edit Dialog */}
      <Dialog
        open={!!editingProfile}
        onOpenChange={(open) => !open && setEditingProfile(null)}
      >
        <DialogContent className="flex flex-col h-svh w-[100dvw] max-w-[100dvw] p-0 overflow-hidden sm:max-w-[1100px] sm:max-h-[min(90vh,850px)] sm:w-[95vw] border-none shadow-2xl">
          <DialogHeader className="shrink-0 px-8 py-6 border-b bg-card/50 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold tracking-tight">
                  Acesso: {editingProfile?.name}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  Defina o que este cargo pode visualizar e operar nos módulos
                  do ERP.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-8 py-4">
            {editingProfile && (
              <ProfilePermissionsMatrix
                perfilName={editingProfile.name}
                allPermissions={allPermissions}
                initialPermissionSlugs={
                  editingProfile.role_permissions?.map(
                    (p: { permission_slug: string }) => p.permission_slug,
                  ) || []
                }
              />
            )}
          </div>

          <DialogFooter className="shrink-0 px-8 py-4 border-t bg-card/50 backdrop-blur-md mt-auto">
            <div className="flex w-full justify-end gap-3 pb-4 pr-4">

              <Button
                className=" rounded-xl shadow-lg shadow-primary/20"
                onClick={() => setEditingProfile(null)}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Fechar e Salvar Alterações
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deletion Alert */}
      <AlertDialog
        open={deleteAlertOpen}
        onOpenChange={(open) => {
          setDeleteAlertOpen(open);
          if (!open) setProfileToDelete(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 text-destructive mb-2">
              <div className="p-2 rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <AlertDialogTitle className="text-xl font-bold">
                Excluir Perfil
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base">
              Você tem certeza que deseja excluir o perfil{" "}
              <strong>{profileToDelete?.name}</strong>?
              <br />
              <br />
              <span className="text-sm text-muted-foreground italic">
                Atenção: Esta ação não pode ser desfeita e falhará se houver
                usuários vinculados a este cargo.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel
              disabled={isDeleting}
              type="button"
              className="rounded-xl px-6 mr-4"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors rounded-xl px-8 shadow-lg shadow-destructive/20"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
