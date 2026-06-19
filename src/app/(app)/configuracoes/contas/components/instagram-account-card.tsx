"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Instagram, Loader2, PlugZap, Unplug } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface InstagramStatus {
  connected: boolean;
  configured: boolean;
  configError?: string | null;
  account?: {
    instagramUserId: string;
    username: string | null;
    accountType: string | null;
    mediaCount: number | null;
    expiresAt: string | null;
    connectedAt: string;
  };
}

function formatDate(value?: string | null) {
  if (!value) return "Sem expiração informada";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function InstagramAccountCard() {
  const [status, setStatus] = useState<InstagramStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  async function loadStatus() {
    setLoading(true);
    try {
      const response = await fetch("/api/instagram/status", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as InstagramStatus & { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível consultar a conexão do Instagram.");
      }

      setStatus(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao consultar Instagram.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();

    const params = new URLSearchParams(window.location.search);
    const connected = params.get("instagram_connected");
    const error = params.get("instagram_error");

    if (connected) toast.success("Conta Instagram conectada com sucesso.");
    if (error) toast.error(error);

    if (connected || error) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      const response = await fetch("/api/instagram/disconnect", { method: "POST" });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível desconectar o Instagram.");
      }

      toast.success("Conta Instagram desconectada.");
      await loadStatus();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao desconectar Instagram.");
    } finally {
      setDisconnecting(false);
    }
  }

  const account = status?.account;
  const canConnect = Boolean(status?.configured && !loading);

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Instagram className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Instagram</CardTitle>
              <CardDescription>
                Entre pela página oficial do Instagram para autorizar a importação de imagens.
              </CardDescription>
            </div>
          </div>
          <Badge variant={status?.connected ? "default" : "outline"}>
            {status?.connected ? "Conectada" : "Não conectada"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando conexão...
          </div>
        ) : status?.configError ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
            {status.configError}
          </div>
        ) : status?.connected && account ? (
          <div className="grid gap-3 text-sm md:grid-cols-2">
            <div>
              <p className="text-muted-foreground">Usuário</p>
              <p className="font-medium">{account.username ? `@${account.username}` : account.instagramUserId}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Tipo de conta</p>
              <p className="font-medium">{account.accountType || "Não informado"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Mídias</p>
              <p className="font-medium">{account.mediaCount ?? "Não informado"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Expira em</p>
              <p className="font-medium">{formatDate(account.expiresAt)}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhuma conta Instagram conectada. Ao continuar, você será redirecionado para a página oficial do Instagram/Meta.
          </p>
        )}
      </CardContent>

      <CardFooter className="justify-end gap-2">
        {status?.connected ? (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                window.location.href = "/api/instagram/oauth/start";
              }}
              disabled={!canConnect || disconnecting}
              className="gap-2"
            >
              <PlugZap className="h-4 w-4" />
              Trocar conta
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="gap-2"
            >
              {disconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unplug className="h-4 w-4" />}
              Desconectar
            </Button>
          </>
        ) : (
          <Button
            type="button"
            onClick={() => {
              window.location.href = "/api/instagram/oauth/start";
            }}
            disabled={!canConnect}
            className="gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Entrar com Instagram
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
