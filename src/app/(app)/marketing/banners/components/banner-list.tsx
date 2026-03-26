"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from "@dnd-kit/modifiers";
import { BannerCard, BannerCardOverlay } from "@/components/marketing/banner-card";
import { Banner, updateBannersOrderAction } from "@/actions/banners";
import { toast } from "sonner";
import { LayoutGrid, Info, Sparkles } from "lucide-react";

interface BannerListProps {
  initialBanners: Banner[];
  onDelete: (id: string, imageUrl: string) => void;
  onUpdate: (id: string, updates: Partial<Banner>) => void;
}

export function BannerList({ initialBanners, onDelete, onUpdate }: BannerListProps) {
  const [banners, setBanners] = useState<Banner[]>(initialBanners);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setBanners(initialBanners);
  }, [initialBanners]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = banners.findIndex((b) => b.id === active.id);
      const newIndex = banners.findIndex((b) => b.id === over.id);

      const newOrder = arrayMove(banners, oldIndex, newIndex);
      setBanners(newOrder);

      // Persist new order
      const orderUpdates = newOrder.map((banner, index) => ({
        ...banner,
        order: index,
      }));

      const result = await updateBannersOrderAction(orderUpdates);
      if (result.success) {
        toast.success("Ordem dos banners atualizada!");
      } else {
        toast.error("Erro ao salvar nova ordem");
        setBanners(initialBanners); // Revert to source of truth
      }
    }

    setActiveId(null);
  };

  const activeBanner = activeId ? banners.find((b) => b.id === activeId) : null;

  if (banners.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 border-2 border-dashed rounded-[3rem] border-primary/10 bg-muted/5 animate-in fade-in zoom-in duration-700">
        <div className="p-8 rounded-full bg-primary/5 text-primary/40 border border-primary/10 mb-8 shadow-inner ring-primary/2">
           <LayoutGrid className="h-16 w-16" />
        </div>
        <p className="text-2xl font-black text-foreground/80 tracking-tight">Galeria Vazia</p>
        <p className="text-sm text-muted-foreground mt-3 max-w-[280px] text-center font-medium leading-relaxed opacity-60">
          Nenhum banner foi cadastrado ainda. Use o painel de upload acima para começar sua vitrine.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between pb-4 border-b border-primary/5 px-4 bg-muted/20 rounded-2xl py-3">
         <div className="flex items-center gap-3 text-primary/70">
            <div className="p-2 bg-primary/10 rounded-lg">
               <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.25em]">Lista de Exposição</span>
         </div>
         <div className="flex items-center gap-2 text-muted-foreground/50 text-[10px] font-bold italic">
            <Info className="h-3.5 w-3.5" />
            Reordene segurando o ícone de arraste lateral
         </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
      >
        <SortableContext
          items={banners.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-8 px-2">
            {banners.map((banner) => (
              <BannerCard
                key={banner.id}
                banner={banner}
                onDelete={onDelete}
                onUpdate={onUpdate}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay
          dropAnimation={{
            duration: 350,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
            sideEffects: defaultDropAnimationSideEffects({
              styles: {
                active: {
                  opacity: '0.4',
                },
              },
            }),
          }}
        >
          {activeBanner ? <BannerCardOverlay banner={activeBanner} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
