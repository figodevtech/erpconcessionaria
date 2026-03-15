"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ForgotPasswordDialog from "./forgot-password-dialog";

export function LoginFormClient() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const [forgotOpen, setForgotOpen] = useState(false);

    const router = useRouter();
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim() || !password.trim()) {
            toast.error("Por favor, preencha e-mail e senha.");
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                switch (error.message) {
                    case "Invalid login credentials":
                        toast.error("E-mail ou senha inválidos.");
                        break;
                    default:
                        toast.error(error.message || "Não foi possível fazer login. Tente novamente.");
                        break;
                }
                return;
            }

            toast.success("Login efetuado!");
            router.push("/");
            router.refresh();
        } catch (e: any) {
            toast.error(e?.message || "Falha de login.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center text-center">
                    <h1 className="text-2xl font-bold">Bem-vindo de volta</h1>
                    <p className="text-muted-foreground text-balance">Conectar ao ERP</p>
                </div>

                <div className="grid gap-3">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="Email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="username"
                    />
                </div>

                <div className="grid gap-3">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Senha</Label>
                    </div>

                    <Input
                        id="password"
                        type="password"
                        placeholder="Senha"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                    />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Entrando..." : "Entrar"}
                </Button>

                <button
                    type="button"
                    className="text-xs underline underline-offset-4 text-muted-foreground hover:text-primary"
                    onClick={() => setForgotOpen(true)}
                >
                    Esqueci minha senha
                </button>
            </div>

            <ForgotPasswordDialog open={forgotOpen} onOpenChange={setForgotOpen} />
        </form>
    );
}