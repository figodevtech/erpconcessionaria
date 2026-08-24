"use client";

import { useState } from "react";
import { ChevronsUpDown, KeyRound, Loader2, LogOut } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();

  return `${parts[0][0]}${parts.at(-1)?.[0] ?? ""}`.toUpperCase();
}

export function NavUser({ user }: { user: { nome: string; email: string } }) {
  const { isMobile } = useSidebar();
  const supabase = createClient();
  const initials = getInitials(user.nome);

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      window.location.assign("/login");
    }
  };

  const openChangePassword = () => {
    setCurrentPassword("");
    setPassword("");
    setPasswordConfirmation("");
    setPasswordDialogOpen(true);
  };

  const handleChangePassword = async () => {
    if (!currentPassword.trim()) return toast.error("Informe a senha atual.");
    if (!password.trim() || !passwordConfirmation.trim()) {
      return toast.error("Preencha a nova senha e a confirmação.");
    }
    if (password !== passwordConfirmation) {
      return toast.error("As senhas não conferem.");
    }
    if (password.length < 8) {
      return toast.error("A nova senha deve ter pelo menos 8 caracteres.");
    }

    setSavingPassword(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        const message = (signInError.message || "").toLowerCase();

        if (message.includes("invalid login")) {
          toast.error("Senha atual incorreta.");
        } else if (message.includes("email not confirmed")) {
          toast.error("E-mail não confirmado. Confirme seu e-mail para alterar a senha.");
        } else {
          toast.error(signInError.message || "Falha ao autenticar no Supabase.");
        }
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        const message = (updateError.message || "").toLowerCase();

        if (message.includes("different")) {
          toast.error("A nova senha deve ser diferente da atual.");
        } else if (message.includes("at least") || message.includes("too short")) {
          toast.error("A senha não atende aos requisitos mínimos.");
        } else {
          toast.error(updateError.message || "Não foi possível alterar a senha.");
        }
        return;
      }

      await supabase.auth.signOut();
      toast.success("Senha alterada com sucesso.");
      setPasswordDialogOpen(false);
      window.location.assign("/login");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Erro inesperado ao alterar a senha.",
      );
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  size="lg"
                  title={`${user.nome} — ${user.email}`}
                  className="cursor-pointer data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center"
                />
              }
            >
              <Avatar className="size-8">
                <AvatarFallback className="bg-sidebar-primary/20 font-semibold text-sidebar-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-medium">{user.nome}</span>
                <span className="truncate text-xs text-sidebar-foreground/70">
                  {user.email}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-(--anchor-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="size-8">
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{user.nome}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={(event) => {
                    event.preventDefault();
                    openChangePassword();
                  }}
                >
                  <KeyRound />
                  Alterar senha
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={(event) => {
                  event.preventDefault();
                  void handleLogout();
                }}
              >
                <LogOut />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar senha</DialogTitle>
            <DialogDescription>
              Informe sua senha atual e defina uma nova.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="senha-atual">Senha atual</Label>
              <Input
                id="senha-atual"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="••••••••"
                disabled={savingPassword}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="nova-senha">Nova senha</Label>
              <Input
                id="nova-senha"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                minLength={8}
                disabled={savingPassword}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="confirma-senha">Confirmar nova senha</Label>
              <Input
                id="confirma-senha"
                type="password"
                value={passwordConfirmation}
                onChange={(event) => setPasswordConfirmation(event.target.value)}
                placeholder="••••••••"
                minLength={8}
                disabled={savingPassword}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:space-x-2">
            <Button
              variant="outline"
              onClick={() => setPasswordDialogOpen(false)}
              disabled={savingPassword}
            >
              Cancelar
            </Button>
            <Button onClick={handleChangePassword} disabled={savingPassword}>
              {savingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando…
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
