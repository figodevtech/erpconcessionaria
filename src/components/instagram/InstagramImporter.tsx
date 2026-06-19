"use client";

import { useMemo, useState } from "react";
import { Check, Image as ImageIcon, Instagram, Loader2, Search, Settings } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  InstagramImportResponse,
  InstagramImportedImage,
  InstagramMediaImage,
  InstagramMediaResponse,
} from "@/types/instagram";

interface InstagramImporterProps {
  vehicleId?: string | number;
  disabled?: boolean;
  onImported?: (imported: InstagramImportedImage[]) => void;
  onConnectionRequired?: () => void;
}

export function InstagramImporter({
  vehicleId,
  disabled,
  onImported,
  onConnectionRequired,
}: InstagramImporterProps) {
  const [postUrl, setPostUrl] = useState("");
  const [images, setImages] = useState<InstagramMediaImage[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [connectionRequired, setConnectionRequired] = useState(false);
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState(false);

  const selectedImages = useMemo(
    () => images.filter((image) => selectedIds.has(image.id)),
    [images, selectedIds],
  );

  async function handleSearch() {
    if (!postUrl.trim()) {
      toast.error("Cole o link da postagem do Instagram.");
      return;
    }

    setSearching(true);
    setImages([]);
    setSelectedIds(new Set());
    setConnectionRequired(false);

    try {
      const response = await fetch("/api/instagram/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postUrl }),
      });
      const data = (await response.json().catch(() => ({}))) as Partial<InstagramMediaResponse> & {
        code?: string;
        error?: string;
      };

      if (!response.ok) {
        if (data.code === "INSTAGRAM_NOT_CONNECTED") {
          setConnectionRequired(true);
          onConnectionRequired?.();
        }
        throw new Error(data.error || "Não foi possível buscar imagens do Instagram.");
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
          images: selectedImages,
          vehicleId,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as Partial<InstagramImportResponse> & {
        code?: string;
        error?: string;
      };

      if (!response.ok || !data.success) {
        if (data.code === "INSTAGRAM_NOT_CONNECTED") {
          setConnectionRequired(true);
          onConnectionRequired?.();
        }
        throw new Error(data.error || "Não foi possível importar as imagens.");
      }

      toast.success("Imagens importadas com sucesso.");
      onImported?.(data.imported || []);
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

  const busy = searching || importing || disabled;

  return (
    <div className="space-y-4 rounded-lg border border-primary/10 bg-background/70 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1.5 md:flex-1">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Instagram className="h-4 w-4 text-primary" />
            Importar do Instagram
          </div>
          <Input
            value={postUrl}
            onChange={(event) => setPostUrl(event.target.value)}
            placeholder="https://www.instagram.com/p/SHORTCODE/"
            disabled={busy}
          />
        </div>
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

      {connectionRequired && (
        <div className="flex flex-col gap-3 rounded-lg border border-amber-500/25 bg-amber-500/10 p-3 text-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-amber-900 dark:text-amber-100">
              Instagram não conectado
            </p>
            <p className="text-muted-foreground">
              Conecte a conta em Configurações &gt; Contas para buscar as imagens pela API autorizada.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              window.location.href = "/configuracoes/contas";
            }}
          >
            <Settings className="h-4 w-4" />
            Abrir Contas
          </Button>
        </div>
      )}

      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {selectedImages.length} de {images.length} selecionada(s)
            </p>
            <Button
              type="button"
              size="sm"
              className="gap-2"
              onClick={handleImport}
              disabled={busy || selectedImages.length === 0}
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
              Prosseguir e importar
            </Button>
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
                    style={{ backgroundImage: `url("${image.media_url}")` }}
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
    </div>
  );
}
