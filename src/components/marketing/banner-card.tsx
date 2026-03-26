"use client";

import { useState } from "react";
import Image from "next/image";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  GripVertical, 
  Trash2, 
  ExternalLink, 
  Save, 
  X, 
  Loader2,
  Eye,
  EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Banner } from "@/actions/banners";

interface BannerCardProps {
  banner: Banner;
  onDelete: (id: string, imageUrl: string) => void;
  onUpdate: (id: string, updates: Partial<Banner>) => void;
}

export function BannerCard({ banner, onDelete, onUpdate }: BannerCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(banner.name);
  const [editLink, setEditLink] = useState(banner.link || "");
  const [isSaving, setIsSaving] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: banner.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onUpdate(banner.id, { name: editName, link: editLink });
      setIsEditing(false);
    } catch (error) {
       console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditName(banner.name);
    setEditLink(banner.link || "");
    setIsEditing(false);
  };

  const toggleActive = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate(banner.id, { active: !banner.active });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex flex-col md:flex-row items-stretch md:items-center gap-6 bg-card border border-primary/5 rounded-4xl p-4 transition-all duration-500 shadow-sm hover:shadow-2xl hover:border-primary/20",
        isDragging && "opacity-50 grayscale scale-[0.98] shadow-inner",
        !banner.active && "opacity-75 bg-muted/20"
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="hidden md:flex cursor-grab active:cursor-grabbing p-2 hover:bg-primary/5 rounded-2xl transition-all text-muted-foreground/40 hover:text-primary"
      >
        <GripVertical className="h-6 w-6" />
      </div>

      {/* Preview */}
      <div className="relative aspect-16/5 md:w-64 rounded-2xl overflow-hidden border border-primary/5 shadow-2xl shrink-0">
        <Image
          src={banner.image_url}
          alt={banner.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        {!banner.active && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] bg-black/60 px-3 py-1.5 rounded-full border border-white/20 shadow-2xl">
              Inativo
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="grow space-y-4 min-w-0 py-2">
        {isEditing ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1">Nome do Banner</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Ex: Promoção de Verão"
                className="h-11 rounded-2xl border-primary/10 focus-visible:ring-primary/20 bg-background/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1">Link de Destino</label>
              <div className="relative">
                <Input
                  value={editLink}
                  onChange={(e) => setEditLink(e.target.value)}
                  placeholder="https://sualoja.com/ofertas"
                  className="h-11 rounded-2xl border-primary/10 focus-visible:ring-primary/20 pl-11 bg-background/50"
                />
                <ExternalLink className="absolute left-4 top-3.5 h-4 w-4 text-primary/40" />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button 
                size="sm" 
                className="rounded-xl h-10 px-6 bg-primary hover:bg-primary/90 text-xs font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar Alterações
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="rounded-xl h-10 px-6 text-xs font-bold border-primary/10 hover:bg-muted transition-all active:scale-95"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="min-w-0 pr-4">
            <div className="flex items-center gap-3 mb-1">
              <h4 className="font-black text-xl lg:text-2xl truncate tracking-tight text-foreground/90 group-hover:text-primary transition-colors">
                {banner.name}
              </h4>
              {banner.active ? (
                 <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
              ) : (
                 <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
              )}
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground/70 mb-6">
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate font-medium">
                {banner.link || "Nenhum link configurado"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Button 
                size="sm" 
                variant="outline" 
                className="rounded-xl h-9 px-4 text-xs font-bold border-primary/10 hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all active:scale-95 shadow-sm"
                onClick={() => setIsEditing(true)}
              >
                Editar Informações
              </Button>
              
              <button 
                className={cn(
                  "text-xs font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-2 px-3 py-2 rounded-xl",
                  banner.active 
                    ? "text-amber-600 bg-amber-500/5 hover:bg-amber-500/10" 
                    : "text-emerald-600 bg-emerald-500/5 hover:bg-emerald-500/10"
                )}
                onClick={toggleActive}
              >
                {banner.active ? (
                  <><EyeOff className="h-3.5 w-3.5" /> Pausar Banner</>
                ) : (
                  <><Eye className="h-3.5 w-3.5" /> Ativar Banner</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-primary/5 p-4 md:p-6 md:ml-4">
        <Button
          size="icon"
          variant="destructive"
          className="h-12 w-12 rounded-[1.25rem] shadow-xl shadow-destructive/10 hover:shadow-destructive/20 hover:scale-110 active:scale-90 transition-all"
          onClick={() => onDelete(banner.id, banner.image_url)}
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

// Minimalist Card for Drag Overlay
export function BannerCardOverlay({ banner }: { banner: Banner }) {
  return (
    <div className="relative flex items-center gap-6 bg-background/95 border-2 border-primary/40 rounded-3xl p-5 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] scale-105 backdrop-blur-xl ring-4 ring-primary/10">
      <div className="p-2 text-primary">
        <GripVertical className="h-6 w-6" />
      </div>
      <div className="relative aspect-16/5 w-40 rounded-xl overflow-hidden border border-primary/20 shadow-2xl">
        <Image
          src={banner.image_url}
          alt={banner.name}
          fill
          className="object-cover"
        />
      </div>
      <div className="grow pr-8">
        <h4 className="font-black text-lg truncate tracking-tight text-primary">{banner.name}</h4>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Movendo Banner...</p>
      </div>
    </div>
  );
}
