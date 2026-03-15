// troque o NavUser anterior por este

"use client";

import { useState } from "react";
import { BadgeCheck, Bell, ChevronsUpDown, LogOut, KeyRound, Loader2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";

import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function NavUser({ user }: { user: { nome: string; email: string } }) {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const supabase = createClient();

  // --- Modal Alterar Senha
  const [pwdOpen, setPwdOpen] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  const openChangePwd = () => {
    setCurrentPwd("");
    setPwd("");
    setPwd2("");
    setPwdOpen(true);
  };

  const handleChangePassword = async () => {
    if (!currentPwd.trim()) return toast.error("Informe a senha atual.");
    if (!pwd.trim() || !pwd2.trim()) return toast.error("Preencha a nova senha e a confirmação.");
    if (pwd !== pwd2) return toast.error("As senhas não conferem.");
    if (pwd.length < 8) return toast.error("A nova senha deve ter pelo menos 8 caracteres.");

    setSavingPwd(true);
    try {
      // 1) sessão temporária no Supabase
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPwd,
      });
      if (signInErr) {
        const msg = (signInErr.message || "").toLowerCase();

        // senha atual errada
        if (msg.includes("invalid login")) {
          toast.error("Senha atual incorreta.");
        } else if (msg.includes("email not confirmed")) {
          toast.error("E-mail não confirmado. Confirme seu e-mail para alterar a senha.");
        } else {
          toast.error(signInErr.message || "Falha ao autenticar no Supabase.");
        }
        return;
      }

      // 2) troca a senha
      const { error: updErr } = await supabase.auth.updateUser({ password: pwd });
      if (updErr) {
        const m = (updErr.message || "").toLowerCase();
        if (m.includes("different")) {
          toast.error("A nova senha deve ser diferente da atual.");
        } else if (m.includes("at least") || m.includes("too short")) {
          toast.error("A senha não atende aos requisitos mínimos.");
        } else {
          toast.error(updErr.message || "Não foi possível alterar a senha.");
        }
        return;
      }

      // 3) limpa sessão temporária do Supabase
      await supabase.auth.signOut();

      toast.success("Senha alterada com sucesso.");
      setPwdOpen(false);
      router.push("/login");
    } catch (e: any) {
      toast.error(e?.message || "Erro inesperado ao alterar a senha.");
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.nome}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            } />

            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{user.nome}</span>
                      <span className="truncate text-xs">{user.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>

                {/* Alterar senha */}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    console.log("Opening change password modal...");
                    openChangePwd();
                  }}
                >
                  <KeyRound />
                  Alterar senha
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={async (e) => {
                  e.preventDefault();
                  console.log("Logging out...");
                  try {
                    await supabase.auth.signOut();
                    console.log("Supabase signOut completed.");
                  } catch (err) {
                    console.error("Error signing out:", err);
                  }
                  // Usar window.location para garantir limpeza total e redirecionamento
                  window.location.href = "/login";
                }}
              >
                <LogOut />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Modal Alterar Senha */}
      <Dialog open={pwdOpen} onOpenChange={setPwdOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar senha</DialogTitle>
            <DialogDescription>Informe sua senha atual e defina uma nova.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="senha-atual">Senha atual</Label>
              <Input
                id="senha-atual"
                type="password"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                placeholder="••••••••"
                disabled={savingPwd}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="nova-senha">Nova senha</Label>
              <Input
                id="nova-senha"
                type="password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                placeholder="••••••••"
                minLength={8}
                disabled={savingPwd}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="confirma-senha">Confirmar nova senha</Label>
              <Input
                id="confirma-senha"
                type="password"
                value={pwd2}
                onChange={(e) => setPwd2(e.target.value)}
                placeholder="••••••••"
                minLength={8}
                disabled={savingPwd}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:space-x-2">
            <Button variant="outline" onClick={() => setPwdOpen(false)} disabled={savingPwd}>
              Cancelar
            </Button>
            <Button onClick={handleChangePassword} disabled={savingPwd}>
              {savingPwd ? (
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
