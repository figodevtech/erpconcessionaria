"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getBannersAction,
  upsertBannerAction,
  deleteBannerAction,
  Banner
} from "@/actions/banners";
import { BannerUploader } from "@/components/marketing/banner-uploader";
import { BannerList } from "./components/banner-list";
import { BannerSettings } from "./components/banner-settings";
import { toast } from "sonner";
import {
  Plus,
  LayoutGrid,
  Loader2,
  Sparkles,
  ArrowRight,
  X,
  Megaphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);

  const fetchBanners = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await getBannersAction();
      if (result.success && result.data) {
        setBanners(result.data);
      } else {
        toast.error("Erro ao carregar banners");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const handleUploadSuccess = async (data: { url: string; name: string; link?: string }) => {
    const newBanner = {
      name: data.name,
      link: data.link || null,
      image_url: data.url,
      active: true,
    };

    const result = await upsertBannerAction(newBanner);
    if (result.success) {
      setShowUploader(false);
      fetchBanners();
    } else {
      toast.error("Erro ao salvar banner no banco");
    }
  };

  const handleDelete = async (id: string, imageUrl: string) => {
    if (!confirm("Tem certeza que deseja excluir este banner?")) return;

    const result = await deleteBannerAction(id, imageUrl);
    if (result.success) {
      toast.success("Banner excluído com sucesso");
      fetchBanners();
    } else {
      toast.error("Erro ao excluir banner");
    }
  };

  const handleUpdate = async (id: string, updates: Partial<Banner>) => {
    const result = await upsertBannerAction({ id, ...updates });
    if (result.success) {
      toast.success("Banner atualizado");
      fetchBanners();
    } else {
      toast.error("Erro ao atualizar banner");
    }
  };

  return (
    <div className="container max-w-6xl mx-auto py-12 px-6 space-y-12 animate-in fade-in duration-1000">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-primary/60">
            <div className="h-px w-8 bg-primary/30" />
            <div className="p-1.5 bg-primary/5 rounded-lg border border-primary/10">
              <Megaphone className="h-3 w-3" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.3em]">Marketing & Visual</span>
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter text-foreground leading-[0.9]">
              Banners do <span className="text-primary italic relative">
                Website
                <div className="absolute -bottom-2 left-0 w-full h-1 bg-primary/20 rounded-full blur-[2px]" />
              </span>
            </h1>
            <p className="text-muted-foreground text-lg font-medium max-w-xl leading-relaxed mt-4">
              Gerencie a vitrine principal do seu site com banners dinâmicos,
              reordenáveis e otimizados para total conversão.
            </p>
          </div>
        </div>

        <Button
          onClick={() => setShowUploader(!showUploader)}
          className={cn(
            "rounded-4xl h-20 px-12 text-base font-black tracking-tight transition-all active:scale-95 shadow-2xl group",
            showUploader
              ? "bg-muted text-foreground hover:bg-muted/80"
              : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20"
          )}
        >
          {showUploader ? (
            <><X className="mr-3 h-6 w-6" /> Cancelar Upload</>
          ) : (
            <><Plus className="mr-3 h-6 w-6 group-hover:rotate-90 transition-transform duration-500" /> Adicionar Banner</>
          )}
        </Button>
      </div>

      {/* Banner Settings Section */}
      <BannerSettings />

      {/* Uploader Section */}
      {showUploader && (
        <Card className="border-none bg-linear-to-br from-primary/4 to-background shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] rounded-[3rem] overflow-hidden animate-in fade-in slide-in-from-top-12 duration-1000 ring-1 ring-primary/5">
          <CardContent className="p-10 lg:p-14 space-y-10">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-primary/10 rounded-2xl text-primary shadow-inner">
                <Sparkles className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight">Novo Visual</h3>
                <p className="text-sm text-muted-foreground font-medium opacity-70">A imagem selecionada será o primeiro impacto visual dos seus clientes.</p>
              </div>
            </div>
            <BannerUploader onSuccess={handleUploadSuccess} />
          </CardContent>
        </Card>
      )}

      {/* List Section */}
      <div className="space-y-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-8 bg-muted/5 rounded-[4rem] border border-primary/5 relative overflow-hidden group">
            <div className="relative">
              <Loader2 className="h-20 w-20 animate-spin text-primary opacity-10" />
              <Loader2 className="h-20 w-20 animate-spin text-primary absolute inset-0 rotate-45 opacity-20" />
              <LayoutGrid className="h-8 w-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-40 group-hover:scale-125 transition-transform duration-1000" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/30 animate-pulse">
              Sincronizando Banco de Dados
            </p>
          </div>
        ) : (
          <BannerList
            initialBanners={banners}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
          />
        )}
      </div>

      {/* Tips Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-20">
        <div className="p-10 rounded-[2.5rem] bg-muted/20 border border-primary/5 space-y-5 hover:bg-muted/30 transition-all duration-500 group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Sparkles className="h-16 w-16 text-amber-500" />
          </div>
          <div className="p-4 bg-background rounded-2xl w-fit shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
            <Sparkles className="h-6 w-6 text-amber-500" />
          </div>
          <h4 className="font-black text-xl tracking-tight">Otimização WebP</h4>
          <p className="text-xs text-muted-foreground font-bold leading-relaxed opacity-60">
            Todas as imagens passam por um rigoroso processo de compressão lossy para o formato **WebP**,
            garantindo que seu site carregue instantaneamente mesmo em conexões lentas.
          </p>
        </div>
        <div className="p-10 rounded-[2.5rem] bg-muted/20 border border-primary/5 space-y-5 hover:bg-muted/30 transition-all duration-500 group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <LayoutGrid className="h-16 w-16 text-blue-500" />
          </div>
          <div className="p-4 bg-background rounded-2xl w-fit shadow-xl group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
            <LayoutGrid className="h-6 w-6 text-blue-500" />
          </div>
          <h4 className="font-black text-xl tracking-tight">Ordenação Inteligente</h4>
          <p className="text-xs text-muted-foreground font-bold leading-relaxed opacity-60">
            Personalize a jornada do cliente reordenando seus destaques.
            Arraste para cima as promoções mais importantes e a posição é salva em tempo real.
          </p>
        </div>
        <div className="p-10 rounded-[2.5rem] bg-muted/20 border border-primary/5 space-y-5 hover:bg-muted/30 transition-all duration-500 group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <ArrowRight className="h-16 w-16 text-emerald-500" />
          </div>
          <div className="p-4 bg-background rounded-2xl w-fit shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
            <ArrowRight className="h-6 w-6 text-emerald-500" />
          </div>
          <h4 className="font-black text-xl tracking-tight">Engajamento Direto</h4>
          <p className="text-xs text-muted-foreground font-bold leading-relaxed opacity-60">
            Vincule cada banner a uma página de destino específica.
            Converta curiosidade em vendas direcionando o tráfego para os veículos certos.
          </p>
        </div>
      </div>
    </div>
  );
}
