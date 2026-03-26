"use client";

import { useState, useRef } from "react";
import { X, ImageIcon, Loader2, Check, Sparkles, ExternalLink, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import imageCompression from "browser-image-compression";
import { toast } from "sonner";
import Image from "next/image";

interface BannerUploaderProps {
  onSuccess: (data: { url: string; name: string; link?: string }) => void;
}

export function BannerUploader({ onSuccess }: BannerUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [bannerName, setBannerName] = useState("");
  const [bannerLink, setBannerLink] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
    setSelectedFile(file);

    // Set a default name based on file name if empty
    if (!bannerName) {
      const nameWithoutExt = file.name.split('.')[0].replace(/[-_]/g, ' ');
      setBannerName(nameWithoutExt.charAt(0).toUpperCase() + nameWithoutExt.slice(1));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    if (!bannerName.trim()) {
      toast.error("Por favor, insira um título para o banner");
      return;
    }

    try {
      setIsUploading(true);

      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/webp'
      };

      const compressedFile = await imageCompression(selectedFile, options);
      const fileName = `${Date.now()}-${selectedFile.name.split('.')[0]}.webp`;
      const filePath = `banners/${fileName}`;

      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from("website")
        .upload(filePath, compressedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("website")
        .getPublicUrl(filePath);

      onSuccess({
        url: publicUrl,
        name: bannerName.trim(),
        link: bannerLink.trim() || undefined
      });
      reset();
    } catch (error: any) {
      toast.error(`Erro no upload: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const reset = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setBannerName("");
    setBannerLink("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="w-full space-y-10">
      {!previewUrl ? (
        <label className="group relative flex flex-col items-center justify-center w-full aspect-16/5 border-2 border-dashed border-primary/10 rounded-4xl bg-muted/5 hover:bg-primary/2 hover:border-primary/30 transition-all duration-500 cursor-pointer overflow-hidden shadow-inner">
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
            <div className="p-6 rounded-3xl bg-primary/10 text-primary mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg shadow-primary/5">
              <ImageIcon className="w-10 h-10" />
            </div>
            <p className="text-2xl font-black tracking-tight text-foreground/80">
              Arraste seu <span className="text-primary italic">Banner</span> aqui
            </p>
            <p className="text-sm font-bold text-muted-foreground mt-3 uppercase tracking-[0.2em] opacity-60">
              Formato Ideal: 16:5 (Ex: 1920x600)
            </p>
            <div className="mt-8 px-8 py-3 rounded-2xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest shadow-2xl shadow-primary/20 group-hover:translate-y-[-4px] transition-transform">
              Escolher Arquivo
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
        </label>
      ) : (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
          <div className="relative aspect-16/5 w-full rounded-[4rem] overflow-hidden border-4 border-primary/10 bg-muted/30 group shadow-[0_50px_120px_-20px_rgba(0,0,0,0.4)] ring-12 ring-primary/5">
            <Image
              src={previewUrl}
              alt="Preview"
              fill
              className="object-cover transition-transform duration-1000 group-hover:scale-105"
            />

            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            <div className="hidden absolute md:flex bottom-8 right-8  items-center gap-4 scale-90 group-hover:scale-100 transition-transform duration-500">
              <div className="bg-black/60 backdrop-blur-2xl border border-white/20 px-6 py-3 rounded-full flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Corte em 16:5 Aplicado</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 items-center py-4 md:grid-cols-2 gap-8 px-10 py-10 bg-muted/20 rounded-[3rem] border border-primary/5 shadow-inner">
            <div className="space-y-3">
              <div className="flex items-center gap-2 ml-2">
                <Type className="h-3.5 w-3.5 text-primary/60" />
                <label className="text-[11px] font-black uppercase tracking-[0.3em] text-primary/60">Título da Campanha</label>
              </div>
              <Input
                value={bannerName}
                onChange={(e) => setBannerName(e.target.value)}
                placeholder="Ex: Black Friday Itamatay"
                className="h-16 rounded-2xl border-none bg-background shadow-xl px-6 text-lg font-bold placeholder:text-muted-foreground/20 focus-visible:ring-primary/20 transition-all font-sans"
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 ml-2">
                <ExternalLink className="h-3.5 w-3.5 text-primary/60" />
                <label className="text-[11px] font-black uppercase tracking-[0.3em] text-primary/60">Página de Destino (Link)</label>
              </div>
              <Input
                value={bannerLink}
                onChange={(e) => setBannerLink(e.target.value)}
                placeholder="Opcional: https://..."
                className="h-16 rounded-2xl border-none bg-background shadow-xl px-6 text-sm font-medium placeholder:text-muted-foreground/20 focus-visible:ring-primary/20 transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-8 px-6 py-8 bg-primary/[0.03] rounded-[3rem] border border-primary/10 border-dashed">
            <div className="flex items-center gap-6 text-muted-foreground ml-4">
              <div className="p-4 bg-primary/10 rounded-2xl border border-primary/10 text-primary shadow-inner">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-black text-foreground tracking-tight">Quase lá!</p>
                <p className="text-xs font-bold uppercase tracking-widest opacity-60">Revise os dados antes de publicar na Home</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
              <Button
                onClick={reset}
                variant="outline"
                disabled={isUploading}
                className="grow md:grow-0 rounded-[1.25rem] h-16 px-10 text-xs font-black uppercase tracking-widest border-primary/10 hover:bg-destructive hover:text-white hover:border-destructive transition-all active:scale-95 bg-background shadow-xl"
              >
                <X className="mr-3 h-5 w-5" />
                Descartar
              </Button>
              <Button
                onClick={handleUpload}
                disabled={isUploading || !bannerName.trim()}
                className="grow md:grow-0 rounded-[1.25rem] h-16 px-12 text-xs font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xl shadow-emerald-900/40 transition-all active:scale-95 group"
              >
                {isUploading ? (
                  <><Loader2 className="mr-3 h-6 w-6 animate-spin" /> Processando...</>
                ) : (
                  <><Check className="mr-3 h-6 w-6 group-hover:scale-125 transition-transform" /> Confirmar e Publicar</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
