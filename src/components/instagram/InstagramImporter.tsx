"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Image as ImageIcon, Instagram, Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type {
  InstagramExtractResponse,
  InstagramExtractedImage,
  InstagramImportedImage,
  InstagramImportResponse,
} from "@/types/instagram";

interface InstagramImporterProps {
  vehicleId?: string | number;
  disabled?: boolean;
  startSortOrder?: number;
  onImported?: (imported: InstagramImportedImage[]) => void;
}

interface InstagramPostOption {
  id: string;
  media_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  caption?: string;
  timestamp?: string;
}

export function InstagramImporter({ vehicleId, disabled, startSortOrder, onImported }: InstagramImporterProps) {
  const [postUrl, setPostUrl] = useState("");
  const [images, setImages] = useState<InstagramExtractedImage[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [posts, setPosts] = useState<InstagramPostOption[]>([]);
  const [connectionLabel, setConnectionLabel] = useState("Verificando...");
  const [connected, setConnected] = useState(false);
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const selectedImages = useMemo(
    () => images.filter((image) => selectedIds.has(image.id)),
    [images, selectedIds],
  );

  useEffect(() => {
    let ignore = false;

    async function loadConnectionStatus() {
      try {
        const response = await fetch("/api/instagram/status", { cache: "no-store" });
        const data = (await response.json().catch(() => ({}))) as {
          connected?: boolean;
          account?: { username?: string | null };
        };

        if (ignore) return;

        if (response.ok && data.connected) {
          setConnected(true);
          setConnectionLabel(data.account?.username ? `@${data.account.username}` : "Conectado");
        } else {
          setConnected(false);
          setConnectionLabel("Não conectado");
        }
      } catch {
        if (!ignore) {
          setConnected(false);
          setConnectionLabel("Indisponível");
        }
      }
    }

    loadConnectionStatus();

    return () => {
      ignore = true;
    };
  }, []);

  async function searchImages(urlToSearch = postUrl) {
    if (!urlToSearch.trim()) {
      toast.error("Cole o link da postagem do Instagram.");
      return;
    }

    setSearching(true);
    setImages([]);
    setSelectedIds(new Set());

    try {
      const response = await fetch("/api/instagram/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlToSearch }),
      });
      const data = (await response.json().catch(() => ({}))) as Partial<InstagramExtractResponse> & {
        error?: string;
        message?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || "Não foi possível buscar imagens do Instagram.");
      }

      const nextImages = data.images || [];
      setImages(nextImages);
      setSelectedIds(new Set(nextImages.map((image) => image.id)));

      if (nextImages.length === 0) {
        toast.error("Nenhuma imagem encontrada nesse post.");
      } else {
        toast.success(`${nextImages.length} imagem(ns) encontrada(s).`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao buscar imagens.");
    } finally {
      setSearching(false);
    }
  }

  async function handleSearch() {
    await searchImages(postUrl);
  }

  async function loadPosts() {
    setPostDialogOpen(true);

    setLoadingPosts(true);
    try {
      const response = await fetch("/api/instagram/posts", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as {
        posts?: InstagramPostOption[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível listar as postagens.");
      }

      setPosts(data.posts || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao listar postagens.");
    } finally {
      setLoadingPosts(false);
    }
  }

  async function handleSelectPost(post: InstagramPostOption) {
    if (!post.permalink) {
      toast.error("Postagem sem link válido.");
      return;
    }

    setPostDialogOpen(false);
    setPostUrl(post.permalink);
    await searchImages(post.permalink);
  }

  async function handleImport() {
    if (selectedImages.length === 0) {
      toast.error("Selecione pelo menos uma imagem para importar.");
      return;
    }

    setImporting(true);

    try {
      const response = await fetch("/api/instagram/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postUrl,
          images: selectedImages.map((image) => ({
            id: image.id,
            url: image.url,
            index: image.index,
          })),
          vehicleId,
          startSortOrder,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as Partial<InstagramImportResponse> & {
        error?: string;
        message?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.message || data.error || "Não foi possível importar as imagens.");
      }

      toast.success("Imagens importadas com sucesso.");
      onImported?.(data.imported || []);
      setImages([]);
      setSelectedIds(new Set());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao importar imagens.");
    } finally {
      setImporting(false);
    }
  }

  function toggleImage(imageId: string) {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(imageId)) {
        next.delete(imageId);
      } else {
        next.add(imageId);
      }
      return next;
    });
  }

  function cancelImportSelection() {
    setImages([]);
    setSelectedIds(new Set());
  }

  const busy = searching || importing || disabled;

  return (
    <div className="space-y-4 rounded-lg border border-primary/10 bg-background/70 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1.5 md:flex-1">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Instagram className="h-4 w-4 text-primary" />
            Importar do Instagram
            <Badge variant={connected ? "default" : "outline"} className="ml-1">
              {connectionLabel}
            </Badge>
          </div>
          <Input
            value={postUrl}
            onChange={(event) => setPostUrl(event.target.value)}
            placeholder="https://www.instagram.com/p/SHORTCODE/"
            disabled={busy}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={loadPosts}
            disabled={busy || !connected}
          >
            {loadingPosts ? <Loader2 className="h-4 w-4 animate-spin" /> : <Instagram className="h-4 w-4" />}
            Selecionar postagem
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={handleSearch}
            disabled={busy}
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Buscar imagens
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        A captura usa apenas metadados públicos da postagem. Se o Instagram limitar o acesso público, a busca pode falhar.
      </p>

      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-muted-foreground">
              {selectedImages.length} de {images.length} selecionada(s)
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => setSelectedIds(new Set())}
                disabled={busy || selectedImages.length === 0}
              >
                <X className="h-4 w-4" />
                Limpar seleção
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={cancelImportSelection}
                disabled={busy}
              >
                <X className="h-4 w-4" />
                Cancelar importação
              </Button>
              <Button
                type="button"
                size="sm"
                className="gap-2"
                onClick={handleImport}
                disabled={busy || selectedImages.length === 0}
              >
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                Importar selecionadas
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {images.map((image) => {
              const selected = selectedIds.has(image.id);

              return (
                <button
                  type="button"
                  key={image.id}
                  onClick={() => toggleImage(image.id)}
                  disabled={busy}
                  aria-label={selected ? "Desselecionar imagem" : "Selecionar imagem"}
                  className={cn(
                    "group relative aspect-square overflow-hidden rounded-lg border bg-muted text-left transition",
                    selected
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border hover:border-primary/60",
                  )}
                >
                  <span
                    className="block h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `url("${image.url}")` }}
                  />
                  <span
                    className={cn(
                      "absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border bg-background/90 shadow-sm",
                      selected ? "border-primary text-primary" : "border-border text-transparent",
                    )}
                  >
                    <Check className="h-4 w-4" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <Dialog open={postDialogOpen} onOpenChange={setPostDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Selecionar postagem</DialogTitle>
            <DialogDescription>
              Escolha uma publicação da conta conectada para carregar as imagens.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-[300px] overflow-y-auto pr-1">
            {loadingPosts ? (
              <div className="flex h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando postagens...
              </div>
            ) : posts.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                Nenhuma postagem encontrada.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {posts.map((post) => {
                  const previewUrl = post.media_url || post.thumbnail_url;

                  return (
                    <button
                      type="button"
                      key={post.id}
                      className="group overflow-hidden rounded-lg border bg-muted text-left transition hover:border-primary"
                      onClick={() => handleSelectPost(post)}
                    >
                      <div
                        className="aspect-square bg-cover bg-center"
                        style={previewUrl ? { backgroundImage: `url("${previewUrl}")` } : undefined}
                      />
                      <div className="space-y-1 p-2">
                        <p className="truncate text-xs font-medium">
                          {post.media_type || "Postagem"}
                        </p>
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {post.caption || post.permalink}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
