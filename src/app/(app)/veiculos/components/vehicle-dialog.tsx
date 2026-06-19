import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  Car,
  Coins,
  MapPin,
  Store,
  Sparkles,
  Image as ImageIcon,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Info,
  Camera,
  FileText,
  Trash2,
  Check,
  Plus,
  Upload,
  AlertCircle,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Calendar,
  DollarSign,
  Tag,
  Hash,
} from "lucide-react";
import { TagInput } from "./tag-input";
import {
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Cog,
  Instagram,
  Video,
  MonitorPlay,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Vehicle } from "./vehicle-list-client";
import imageCompression from "browser-image-compression";
import { createClient } from "@/utils/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
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
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  restrictToWindowEdges,
  snapCenterToCursor,
} from "@dnd-kit/modifiers";
import { AIDescriptionBox } from "./ai-description-box";
import { formatCurrency, parseCurrency } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";
import { VehicleFinanceTab } from "./vehicle-finance-tab";
import { VehicleAttachmentsTab } from "./vehicle-attachments-tab";
import { VehicleSaleTab } from "./vehicle-sale-tab";
import type { VehicleStatus } from "@/lib/vehicle-status";
import { InstagramImporter } from "@/components/instagram/InstagramImporter";
import type { InstagramImportedImage } from "@/types/instagram";

export interface VehicleFormValues {
  type: string;
  brand: string;
  model: string;
  version: string;
  year: number | "";
  year_model: number | "";
  price: number;
  purchase_price?: number | null;
  fipe?: number | null;
  show_fipe_price: boolean;
  mileage?: number | null;
  fuel: string;
  transmission: string;
  color: string;
  doors: number | "";
  body_type: string;
  image?: string;
  city: string;
  state: string;
  seller: string;
  seller_type: "dealership" | "store" | "private";
  features: string[];
  description: string;
  enable_ai_description: boolean;
  ai_description?: string | null;
  engine_size?: string | null;
  horsepower?: number | null;
  is_new: boolean;
  status: VehicleStatus;
  featured: boolean;
  plate: string;
  chassi?: string | null;
  renavam?: string | null;
}

type FipeOption = { code: string; name: string };

function normalizeFipeOptions(data: unknown): FipeOption[] {
  const items =
    Array.isArray(data)
      ? data
      : data && typeof data === "object"
        ? Array.isArray((data as { models?: unknown }).models)
          ? (data as { models: unknown[] }).models
          : Array.isArray((data as { modelos?: unknown }).modelos)
            ? (data as { modelos: unknown[] }).modelos
            : Array.isArray((data as { value?: unknown }).value)
              ? (data as { value: unknown[] }).value
              : []
        : [];

  return items.filter(
    (item): item is FipeOption =>
      item !== null &&
      typeof item === "object" &&
      typeof (item as FipeOption).code === "string" &&
      typeof (item as FipeOption).name === "string",
  );
}

interface VehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle?: Vehicle | null;
  onSuccess: (vehicle?: Vehicle) => void;
}

const tabTheme =
  " dark:data-[state=active]:bg-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground";

export function VehicleDialog({
  open,
  onOpenChange,
  vehicle,
  onSuccess,
}: VehicleDialogProps) {
  const { hasPermission } = usePermissions();
  const canUpdate = hasPermission("vehicles:update");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiStats, setAiStats] = useState<{ used: number; limit: number; remaining: number } | null>(null);
  const [vehicleImages, setVehicleImages] = useState<any[]>([]);
  const isEditing = !!vehicle;

  const form = useForm<VehicleFormValues>({
    defaultValues: {
      type: "cars",
      brand: "",
      model: "",
      version: "",
      year: "" as any,
      year_model: "" as any,
      price: 0,
      purchase_price: null,
      fipe: null,
      show_fipe_price: false,
      mileage: null,
      fuel: "",
      transmission: "",
      color: "",
      doors: "" as any,
      body_type: "",
      image: "",
      city: "",
      state: "",
      seller: "",
      seller_type: "dealership",
      features: [],
      description: "",
      enable_ai_description: false,
      ai_description: "",
      engine_size: "",
      horsepower: null,
      is_new: false,
      status: "Rascunho",
      featured: false,
      plate: "",
      chassi: "",
      renavam: "",
    },
  });

  // Fetch AI stats on load
  useEffect(() => {
    async function fetchAIStats() {
      if (!open) return;
      try {
        const response = await fetch("/api/ai/generate-description");
        if (response.ok) {
          const data = await response.json();
          setAiStats(data);
        }
      } catch (error) {
        console.error("Error fetching AI stats:", error);
      }
    }
    fetchAIStats();
  }, [open]);

  // Fetch updated vehicle data when dialog opens for editing
  useEffect(() => {
    async function loadVehicleData() {
      if (!open || !vehicle?.id || fetching) return;

      setFetching(true);
      try {
        const response = await fetch(`/api/vehicles?id=${vehicle.id}`);
        if (!response.ok) throw new Error("Falha ao carregar dados do veículo");

        const result = await response.json();
        const updatedVehicle = result.data?.[0];

        if (updatedVehicle) {
          setVehicleImages(updatedVehicle.vehicle_images || []);
          form.reset({
            type: updatedVehicle.type || "cars",
            brand: updatedVehicle.brand || "",
            model: updatedVehicle.model || "",
            version: updatedVehicle.version || "",
            year: updatedVehicle.year || new Date().getFullYear(),
            year_model: updatedVehicle.year_model || new Date().getFullYear(),
            price: updatedVehicle.price || 0,
            purchase_price: updatedVehicle.purchase_price || null,
            fipe: updatedVehicle.fipe || null,
            show_fipe_price: updatedVehicle.show_fipe_price || false,
            mileage: updatedVehicle.mileage || null,
            fuel: updatedVehicle.fuel || "",
            transmission: updatedVehicle.transmission || "",
            color: updatedVehicle.color || "",
            doors: updatedVehicle.doors ?? 4,
            body_type: updatedVehicle.body_type || "",
            image: updatedVehicle.image || "",
            city: updatedVehicle.city || "",
            state: updatedVehicle.state || "",
            seller: updatedVehicle.seller || "",
            seller_type: updatedVehicle.seller_type || "dealership",
            features: updatedVehicle.features || [],
            description: updatedVehicle.description || "",
            enable_ai_description:
              updatedVehicle.enable_ai_description || false,
            ai_description: updatedVehicle.ai_description || "",
            engine_size: updatedVehicle.engine_size || "",
            horsepower: updatedVehicle.horsepower || null,
            is_new: updatedVehicle.is_new || false,
            status: updatedVehicle.status || "Rascunho",
            featured: updatedVehicle.featured || false,
            plate: updatedVehicle.plate || "",
            chassi: updatedVehicle.chassi || "",
            renavam: updatedVehicle.renavam || "",
          });
        }
      } catch (error) {
        console.error("Error fetching vehicle:", error);
        toast.error("Não foi possível carregar os dados atualizados.");
      } finally {
        setFetching(false);
      }
    }

    if (open && vehicle) {
      loadVehicleData();
    } else if (open && !vehicle) {
      form.reset({
        type: "cars",
        brand: "",
        model: "",
        version: "",
        year: "" as any,
        year_model: "" as any,
        price: 0,
        purchase_price: null,
        fipe: null,
        show_fipe_price: false,
        mileage: null,
        fuel: "",
        transmission: "",
        color: "",
        doors: "" as any,
        body_type: "",
        image: "",
        city: "",
        state: "",
        seller: "",
        seller_type: "dealership",
        features: [],
        description: "",
        enable_ai_description: false,
        ai_description: "",
        engine_size: "",
        horsepower: null,
        is_new: false,
        status: "Rascunho",
        featured: false,
        plate: "",
        chassi: "",
        renavam: "",
      });
      setVehicleImages([]);
    }
  }, [open, vehicle?.id, form]);

  // FIPE States
  const [fipeBrands, setFipeBrands] = useState<{ code: string, name: string }[]>([]);
  const [fipeModels, setFipeModels] = useState<{ code: string, name: string }[]>([]);
  const [fipeBaseModels, setFipeBaseModels] = useState<string[]>([]);
  const [fipeVersions, setFipeVersions] = useState<string[]>([]);
  const [loadingFipe, setLoadingFipe] = useState(false);

  // Combobox Filtering States
  const [brandSearch, setBrandSearch] = useState("");
  const [modelSearch, setModelSearch] = useState("");
  const [versionSearch, setVersionSearch] = useState("");

  const typeValue = form.watch("type");
  const brandValue = form.watch("brand");
  const modelValue = form.watch("model");

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    async function fetchBrands() {
      if (!typeValue) return;
      setFipeBrands([]);
      setFipeModels([]);
      setFipeBaseModels([]);
      setFipeVersions([]);
      setLoadingFipe(true);
      try {
        const res = await fetch(`https://fipe.parallelum.com.br/api/v2/${typeValue}/brands`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Erro ao consultar marcas na FIPE.");
        const data = await res.json();
        if (!ignore) setFipeBrands(normalizeFipeOptions(data));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Error fetching FIPE brands:", error);
        if (!ignore) setFipeBrands([]);
      } finally {
        if (!ignore) setLoadingFipe(false);
      }
    }
    fetchBrands();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [typeValue]);

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;

    async function fetchModels() {
      if (!brandValue || fipeBrands.length === 0) {
        setFipeModels([]);
        setFipeBaseModels([]);
        setFipeVersions([]);
        return;
      }
      const selectedBrand = fipeBrands.find(b => b.name.toLowerCase() === brandValue.toLowerCase());
      if (!selectedBrand) {
        setFipeModels([]);
        setFipeBaseModels([]);
        setFipeVersions([]);
        return;
      }

      setLoadingFipe(true);
      try {
        const res = await fetch(`https://fipe.parallelum.com.br/api/v2/${typeValue}/brands/${selectedBrand.code}/models`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Erro ao consultar modelos na FIPE.");
        const data = await res.json();
        const models = normalizeFipeOptions(data);
        if (ignore) return;
        setFipeModels(models);

        // Derive base models: first word
        const bases = new Set<string>();
        models.forEach((m) => {
          const firstWord = m.name.split(" ")[0];
          bases.add(firstWord);
        });
        setFipeBaseModels(Array.from(bases).sort());
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.error("Error fetching FIPE models:", error);
        if (!ignore) {
          setFipeModels([]);
          setFipeBaseModels([]);
          setFipeVersions([]);
        }
      } finally {
        if (!ignore) setLoadingFipe(false);
      }
    }
    fetchModels();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [typeValue, brandValue, fipeBrands]);

  useEffect(() => {
    if (!modelValue || fipeModels.length === 0) {
      setFipeVersions([]);
      return;
    }

    // Extract versions from models that start with the base model
    const versions = new Set<string>();
    fipeModels.forEach(m => {
      if (m.name.startsWith(modelValue + " ") || m.name === modelValue) {
        let versionText = m.name.substring(modelValue.length).trim();
        if (!versionText) versionText = "Standard";
        versions.add(versionText);
      }
    });
    setFipeVersions(Array.from(versions).sort());
  }, [modelValue, fipeModels]);

  async function onSubmit(values: VehicleFormValues) {
    const requiredFields = [
      { key: "type", label: "Tipo" },
      { key: "brand", label: "Marca" },
      { key: "model", label: "Modelo" },
      { key: "version", label: "Versão" },
      { key: "year", label: "Ano Fabr." },
      { key: "year_model", label: "Ano Modelo" },
      { key: "price", label: "Preço" },
      { key: "fuel", label: "Combustível" },
      { key: "transmission", label: "Transmissão" },
      { key: "color", label: "Cor" },
      { key: "doors", label: "Portas" },
      { key: "body_type", label: "Carroceria" },
      { key: "city", label: "Cidade" },
      { key: "state", label: "Estado" },
      { key: "seller", label: "Vendedor" },
      { key: "description", label: "Descrição" },
      { key: "plate", label: "Placa" },
      { key: "status", label: "Status" },
    ] as const;

    let hasError = false;
    const errorMessages: string[] = [];

    form.clearErrors();

    requiredFields.forEach((field) => {
      const value = values[field.key as keyof VehicleFormValues];

      // Skip doors for motorcycles
      if (field.key === "doors" && values.type === "motorcycles") return;

      if (value === undefined || value === null || value === "") {
        if (field.key === "price" && (value as any) === 0) return; // Special case: Allow 0 price
        form.setError(field.key as any, { type: "manual", message: `${field.label} é obrigatório(a)` });
        errorMessages.push(`${field.label} é obrigatório(a)`);
        hasError = true;
      }
    });

    if (hasError) {
      toast.error("Campos obrigatórios não preenchidos", {
        description: errorMessages.slice(0, 3).join(" • ") + (errorMessages.length > 3 ? "..." : ""),
        duration: 6000,
      });
      return;
    }

    setLoading(true);
    try {
      const url = "/api/vehicles";
      const method = isEditing ? "PATCH" : "POST";
      const normalizedValues = {
        ...values,
        purchase_price: values.purchase_price ?? null,
        show_fipe_price: values.show_fipe_price ?? false,
        chassi: values.chassi?.trim() || null,
        renavam: values.renavam?.trim() || null,
      };
      const body = isEditing ? { ...normalizedValues, id: vehicle.id } : normalizedValues;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao salvar veículo");
      }

      const savedVehicle = await response.json();

      // Update image sort order if we have images and we are editing
      if (isEditing && vehicleImages.length > 1) {
        const sortedImages = vehicleImages.map((img, index) => ({
          id: img.id,
          sort_order: index,
        }));

        const imagesResponse = await fetch("/api/vehicles/images", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: sortedImages }),
        });

        if (!imagesResponse.ok) {
          console.error("Failed to update image order");
          // Non-critical error, we still successfully saved the vehicle
        }
      }

      toast.success(
        isEditing
          ? "Veículo atualizado com sucesso!"
          : "Veículo criado com sucesso!",
      );
      onSuccess(savedVehicle);
    } catch (error: any) {
      console.error("Error saving vehicle:", error);
      toast.error(error.message || "Erro ao salvar veículo");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateAIDescription() {
    if (!vehicle?.id) {
      toast.error("Salve o veículo primeiro antes de gerar a descrição com IA.");
      return;
    }

    setGeneratingAI(true);
    try {
      const response = await fetch("/api/ai/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: vehicle.id,
          action: form.watch("ai_description") ? 'regenerate' : 'generate'
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao gerar descrição");
      }

      form.setValue("ai_description", result.description);
      form.setValue("enable_ai_description", true);

      // Update stats if returned
      if (result.stats) {
        setAiStats(result.stats);
      }

      toast.success("Descrição gerada com IA com sucesso!", {
        description: `Você ainda tem ${result.stats?.remaining || 0} gerações este mês.`
      });
    } catch (error: any) {
      console.error("Error generating AI description:", error);
      toast.error(error.message || "Erro ao gerar descrição com IA");
    } finally {
      setGeneratingAI(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col h-svh w-dvw max-w-dvw p-0 overflow-hidden sm:max-w-[1100px] sm:max-h-[min(90vh,850px)] sm:w-[95vw] border-none shadow-2xl">
        {fetching && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all animate-in fade-in duration-200">
            <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-card border shadow-lg">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm font-semibold animate-pulse text-muted-foreground">
                Sincronizando dados...
              </p>
            </div>
          </div>
        )}

        <DialogHeader className="shrink-0 px-8 py-6 border-b bg-card/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Car className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold tracking-tight">
                {isEditing ? `Editar Veículo #${vehicle?.id}` : "Novo Veículo"}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                {isEditing
                  ? "Gerencie as informações detalhadas deste veículo."
                  : "Cadastre um novo veículo preenchendo as informações abaixo."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <Tabs
              defaultValue="Geral"
              className="flex min-h-0 flex-1 flex-col overflow-hidden pb-0"
            >
              <div className="px-2 py-2 bg-muted/30 border-b ">
                <TabsList className="h-12 bg-background/50 backdrop-blur-sm rounded-xl border -mb-px">
                  <TabsTrigger
                    value="Geral"
                    className={"px-6 rounded-lg transition-all" + tabTheme}
                  >
                    Geral
                  </TabsTrigger>
                  <TabsTrigger
                    value="Marketplace"
                    className={"px-6 rounded-lg transition-all" + tabTheme}
                  >
                    Marketplace
                  </TabsTrigger>
                  {vehicle?.id && (
                    <TabsTrigger
                      value="Venda"
                      className={"px-6 rounded-lg transition-all" + tabTheme}
                    >
                      Venda
                    </TabsTrigger>
                  )}
                  {vehicle?.id && (
                    <TabsTrigger
                      value="Financeiro"
                      className={"px-6 rounded-lg transition-all" + tabTheme}
                    >
                      Financeiro
                    </TabsTrigger>
                  )}
                  {vehicle?.id && (
                    <TabsTrigger
                      value="Anexos"
                      className={"px-6 rounded-lg transition-all" + tabTheme}
                    >
                      Anexos
                    </TabsTrigger>
                  )}
                  {vehicle?.id && (
                    <TabsTrigger
                      value="Mídia"
                      className={"px-6 rounded-lg transition-all" + tabTheme}
                    >
                      Mídia
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>

              <TabsContent
                className="flex-1 min-h-0 overflow-hidden p-0"
                value="Geral"
              >
                <ScrollArea className="h-full px-4 py-6 bg-muted-foreground/5">
                  <GeneralTab
                    form={form}
                    loading={loading || !canUpdate}
                    fipeBrands={fipeBrands}
                    fipeModels={fipeModels}
                    fipeBaseModels={fipeBaseModels}
                    fipeVersions={fipeVersions}
                    loadingFipe={loadingFipe}
                  />
                </ScrollArea>
              </TabsContent>

              <TabsContent
                className="flex-1 min-h-0 overflow-hidden p-0"
                value="Marketplace"
              >
                <ScrollArea className="h-full px-4 py-6 bg-muted-foreground/5">
                  <MarketplaceTab
                    form={form}
                    loading={loading || !canUpdate}
                    onGenerateAI={handleGenerateAIDescription}
                    generatingAI={generatingAI}
                    aiStats={aiStats}
                  />
                </ScrollArea>
              </TabsContent>

              {vehicle?.id && (
                <TabsContent
                  className="flex-1 min-h-0 overflow-hidden p-0"
                  value="Venda"
                >
                  <ScrollArea className="h-full px-4 py-6 bg-muted-foreground/5">
                    <VehicleSaleTab vehicle={vehicle} onSuccess={(v) => {
                       if (onSuccess) onSuccess(v);
                    }} />
                  </ScrollArea>
                </TabsContent>
              )}

              {vehicle?.id && (
                <TabsContent
                  className="flex-1 min-h-0 overflow-hidden p-0"
                  value="Financeiro"
                >
                  <ScrollArea className="h-full px-4 py-6 bg-muted-foreground/5">
                    <VehicleFinanceTab vehicle={vehicle} onSuccess={(v) => {
                       if (onSuccess) onSuccess(v);
                    }} />
                  </ScrollArea>
                </TabsContent>
              )}

              {vehicle?.id && (
                <TabsContent
                  className="flex-1 min-h-0 overflow-hidden p-0"
                  value="Anexos"
                >
                  <ScrollArea className="h-full px-4 py-6 bg-muted-foreground/5">
                    <VehicleAttachmentsTab vehicle={vehicle} />
                  </ScrollArea>
                </TabsContent>
              )}

              {vehicle?.id && (
                <TabsContent
                  className="flex-1 min-h-0 overflow-hidden p-0"
                  value="Mídia"
                >
                  <ScrollArea className="h-full px-4 py-6 bg-muted-foreground/5">
                    <MediaTab
                      vehicleId={vehicle?.id}
                      form={form}
                      images={vehicleImages}
                      onImagesChange={setVehicleImages}
                      onImageDeleted={(id) =>
                        setVehicleImages((prev) =>
                          prev.filter((img) => img.id !== id),
                        )
                      }
                      loading={loading || !canUpdate}
                    />
                  </ScrollArea>
                </TabsContent>
              )}
            </Tabs>

            <DialogFooter className="shrink-0 px-8 py-4 border-t bg-card/50 backdrop-blur-md mt-auto">
              <div className="flex w-full justify-end gap-3 pb-4 pr-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                  className="px-6 rounded-xl hover:bg-muted hover:cursor-pointer"
                >
                  Cancelar
                </Button>
                {canUpdate && (
                  <Button
                    type="submit"
                    disabled={loading}
                    className="hover:cursor-pointer px-8 rounded-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform"
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Salvar Veículo
                  </Button>
                )}
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function GeneralTab({
  form,
  loading,
  fipeBrands,
  fipeModels,
  fipeBaseModels,
  fipeVersions,
  loadingFipe
}: {
  form: any;
  loading: boolean;
  fipeBrands: { code: string, name: string }[];
  fipeModels: { code: string, name: string }[];
  fipeBaseModels: string[];
  fipeVersions: string[];
  loadingFipe: boolean;
}) {
  const brandVal = form.watch("brand");
  const modelVal = form.watch("model");
  const versionVal = form.watch("version");

  const [brandSearch, setBrandSearch] = useState(brandVal || "");
  const [modelSearch, setModelSearch] = useState(modelVal || "");
  const [versionSearch, setVersionSearch] = useState(versionVal || "");
  const [loadingFipePrice, setLoadingFipePrice] = useState(false);

  useEffect(() => {
    setBrandSearch(brandVal || "");
  }, [brandVal]);

  useEffect(() => {
    setModelSearch(modelVal || "");
  }, [modelVal]);

  useEffect(() => {
    setVersionSearch(versionVal || "");
  }, [versionVal]);

  const filteredBrands = fipeBrands.filter(b => b.name.toLowerCase().includes(brandSearch.toLowerCase()));
  const filteredModels = fipeBaseModels.filter(m => m.toLowerCase().includes(modelSearch.toLowerCase()));
  const filteredVersions = fipeVersions.filter(v => v.toLowerCase().includes(versionSearch.toLowerCase()));

  const fetchFipePrice = async () => {
    const type = form.getValues("type") || "cars";
    const brandName = form.getValues("brand");
    const modelName = form.getValues("model");
    const versionName = form.getValues("version");
    const yearModel = form.getValues("year_model");

    if (!brandName || !modelName || !versionName || !yearModel) {
      toast.error("Preencha Marca, Modelo, Versão e Ano Modelo para buscar a Fipe.");
      return;
    }

    try {
      setLoadingFipePrice(true);

      const brandObj = fipeBrands.find((b) => b.name === brandName);
      if (!brandObj) throw new Error("Marca não encontrada nos registros de base da FIPE.");

      const exactFipeName = modelName === versionName ? modelName : `${modelName} ${versionName}`;
      const modelObj = fipeModels.find(m => m.name === exactFipeName);
      if (!modelObj) throw new Error("Combinação exata de Modelo/Versão não encontrada.");

      const yearsRes = await fetch(`https://fipe.parallelum.com.br/api/v2/${type}/brands/${brandObj.code}/models/${modelObj.code}/years`);
      if (!yearsRes.ok) throw new Error("Erro ao consultar anos base para essa versão.");
      const yearsData: { code: string, name: string }[] = await yearsRes.json();

      const yearStr = String(yearModel);
      const yearObj = yearsData.find(y => y.code.startsWith(yearStr) || y.name.includes(yearStr));
      if (!yearObj) throw new Error("Ano compatível não foi localizado na tabela FIPE.");

      const priceRes = await fetch(`https://fipe.parallelum.com.br/api/v2/${type}/brands/${brandObj.code}/models/${modelObj.code}/years/${yearObj.code}`);
      if (!priceRes.ok) throw new Error("Erro ao recuperar a avaliação de preço FIPE.");
      const priceData = await priceRes.json();

      if (priceData && priceData.price) {
        // "R$ 10.000,00" -> 10000.00
        const cleanPriceString = priceData.price.replace(/[^\d,]/g, '').replace(',', '.');
        const priceNumber = parseFloat(cleanPriceString);
        if (!isNaN(priceNumber)) {
          form.setValue("fipe", priceNumber, { shouldValidate: true, shouldDirty: true });
          toast.success("Preço base da FIPE preenchido!");
        }
      }
    } catch (error: any) {
      console.error("FIPE Price Error:", error);
      toast.error(error.message || "Erro indetectado ao comunicar com FIPE.");
    } finally {
      setLoadingFipePrice(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-1">
      {/* Veículo Profile Section */}
      <div className="group border rounded-3xl p-8 bg-linear-to-br from-primary/5 via-card to-background shadow-lg space-y-8 border-primary/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
          <Camera className="h-32 w-32 text-primary" />
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
          {/* Avatar/Preview Circle */}
          <div className="relative shrink-0 mx-auto md:mx-0">
            <div className="h-40 w-40 rounded-full border-4 border-background shadow-xl overflow-hidden bg-muted group-hover:scale-105 transition-transform duration-500 ring-4 ring-primary/10">
              {form.watch("image") ? (
                <img
                  src={form.watch("image")}
                  alt="Vehicle Profile"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src =
                      "https://placehold.co/400x400/f3f4f6/9ca3af?text=Sem+Foto";
                  }}
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground/40">
                  <Camera className="h-12 w-12" />
                </div>
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 p-3 bg-primary text-primary-foreground rounded-full shadow-lg border-4 border-background">
              <Camera className="h-5 w-5" />
            </div>
          </div>

          {/* Image URL Input and Header */}
          <div className="space-y-3">
            <div className="space-y-1">
              <h3 className="text-2xl font-bold tracking-tight bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {form.watch("brand") || form.watch("model")
                  ? `${form.watch("brand") || ""} ${form.watch("model") || ""}`.trim()
                  : "Novo Veículo"}
                {form.watch("version") && (
                  <span className="ml-2 text-lg font-medium text-muted-foreground/70">
                    {form.watch("version")}
                  </span>
                )}
              </h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <p className="text-sm font-semibold text-primary flex items-center gap-1.5 bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                  {form.watch("year") && form.watch("year_model") ? (
                    <>
                      <Zap className="h-3 w-3" />
                      {form.watch("year")} / {form.watch("year_model")}
                    </>
                  ) : (
                    <span className="text-muted-foreground font-normal">
                      Ano e Modelo pendentes
                    </span>
                  )}
                </p>

                {/* Descriptive Specs Summary */}
                <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-muted-foreground mr-auto">
                  {form.watch("price") && (
                    <div className="flex items-center gap-1 bg-muted/40 px-2 py-0.5 rounded-full">
                      <Coins className="h-3 w-3 text-primary/60" />
                      R${" "}
                      {Number(form.watch("price")).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                  )}
                  {form.watch("mileage") && (
                    <div className="flex items-center gap-1 bg-muted/40 px-2 py-0.5 rounded-full">
                      <MapPin className="h-3 w-3 text-primary/60" />
                      {Number(form.watch("mileage")).toLocaleString("pt-BR")} KM
                    </div>
                  )}
                  {(form.watch("fuel") || form.watch("transmission")) && (
                    <div className="flex items-center gap-1 bg-muted/40 px-2 py-0.5 rounded-full lowercase first-letter:uppercase">
                      <Zap className="h-3 w-3 text-primary/60" />
                      {[form.watch("fuel"), form.watch("transmission")]
                        .filter(Boolean)
                        .join(" • ")}
                    </div>
                  )}
                  {form.watch("color") && (
                    <div className="flex items-center gap-1 bg-muted/40 px-2 py-0.5 rounded-full">
                      <div
                        className="h-2 w-2 rounded-full border border-black/10"
                        style={{ backgroundColor: "currentColor" }}
                      />
                      {form.watch("color")}
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="featured"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0 bg-primary/5 px-3 py-1.5 rounded-xl border border-primary/20 hover:bg-primary/10 transition-colors cursor-pointer group/switch">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={loading}
                          className="data-[state=checked]:bg-primary scale-90"
                        />
                      </FormControl>
                      <FormLabel className="text-[10px] font-bold uppercase tracking-wider text-primary cursor-pointer select-none">
                        Veículo Destaque
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Informações Básicas */}
      <div className="group border rounded-2xl p-6 bg-card/50 shadow-sm hover:shadow-md hover:bg-card transition-all space-y-6 border-primary/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-primary/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Car className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">
                Informações Básicas
              </h3>
              <p className="text-xs text-muted-foreground">
                Dados essenciais para identificação do veículo
              </p>
            </div>
          </div>

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-3 min-w-[200px]">
                <FormLabel className={cn(
                  "text-sm font-semibold shrink-0",
                  form.formState.errors.status && "text-destructive"
                )}>
                  Status *
                </FormLabel>
                <div className="flex-1">
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger className={cn(
                        "bg-background/50 rounded-lg border-primary/10 hover:border-primary transition-colors h-9",
                        form.formState.errors.status && "border-destructive ring-1 ring-destructive"
                      )}>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent alignItemWithTrigger={false}>
                      <SelectItem value="Em venda">Em venda</SelectItem>
                      <SelectItem value="Repasse">Repasse</SelectItem>
                      <SelectItem value="Em breve">Em breve</SelectItem>
                      <SelectItem value="Vendido">Vendido</SelectItem>
                      <SelectItem value="Rascunho">Rascunho</SelectItem>
                      <SelectItem value="Pagamento">Pagamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Tipo *
                </FormLabel>
                <Select
                  onValueChange={(val) => {
                    field.onChange(val);
                    form.setValue("brand", "");
                    form.setValue("model", "");
                    form.setValue("version", "");
                    if (val === "motorcycles") {
                      form.setValue("body_type", "Moto", { shouldValidate: true });
                      form.setValue("doors", 0, { shouldValidate: true });
                    } else if (form.getValues("body_type") === "Moto") {
                      form.setValue("body_type", "");
                      form.setValue("doors", "" as any);
                    }
                  }}
                  value={field.value === "cars" ? "Carros/Utilitários/SUV" : field.value === "motorcycles" ? "Motos" : field.value === "trucks" ? "Caminhões" : ""}
                  disabled={loading || loadingFipe}
                >
                  <FormControl>
                    <SelectTrigger className={cn(
                      "bg-background/50 rounded-lg h-10 w-full",
                      form.formState.errors.type && "border-destructive ring-1 ring-destructive"
                    )}>
                      <SelectValue placeholder="Selecione Categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent alignItemWithTrigger={false}>
                    <SelectItem value="cars">Carros/Utilitários/SUV</SelectItem>
                    <SelectItem value="motorcycles">Motos</SelectItem>
                    <SelectItem value="trucks">Caminhões</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={cn(
                  "text-xs font-bold uppercase tracking-wider text-muted-foreground flex justify-between",
                  form.formState.errors.brand && "text-destructive"
                )}>
                  <span>Marca *</span>
                  {loadingFipe && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                </FormLabel>
                <Combobox
                  items={filteredBrands.map(b => b.name)}
                  value={field.value}
                  inputValue={brandSearch}
                  onInputValueChange={setBrandSearch}
                  onValueChange={(val) => {
                    field.onChange(val);
                    form.setValue("model", "");
                    form.setValue("version", "");
                  }}
                  disabled={loading || loadingFipe || fipeBrands.length === 0}
                >
                  <FormControl>
                    <ComboboxInput
                      placeholder={loadingFipe ? "Carregando..." : "Selecione a Marca"}
                      className={cn("bg-background/50 rounded-lg h-10 w-full", form.formState.errors.brand && "border-destructive ring-1 ring-destructive")}
                    />
                  </FormControl>
                  <ComboboxContent>
                    <ComboboxEmpty>Nenhuma marca encontrada.</ComboboxEmpty>
                    <ComboboxList>
                      {(item: string) => (
                        <ComboboxItem key={item} value={item}>
                          {item}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={cn(
                  "text-xs font-bold uppercase tracking-wider text-muted-foreground flex justify-between",
                  form.formState.errors.model && "text-destructive"
                )}>
                  <span>Modelo *</span>
                  {loadingFipe && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                </FormLabel>
                <Combobox
                  items={filteredModels}
                  value={field.value}
                  inputValue={modelSearch}
                  onInputValueChange={setModelSearch}
                  onValueChange={(val) => {
                    field.onChange(val);
                    form.setValue("version", "");
                  }}
                  disabled={loading || loadingFipe || fipeBaseModels.length === 0}
                >
                  <FormControl>
                    <ComboboxInput
                      placeholder={loadingFipe ? "Carregando..." : "Selecione o Modelo"}
                      className={cn("bg-background/50 rounded-lg h-10 w-full", form.formState.errors.model && "border-destructive ring-1 ring-destructive")}
                    />
                  </FormControl>
                  <ComboboxContent>
                    <ComboboxEmpty>Nenhum modelo encontrado.</ComboboxEmpty>
                    <ComboboxList>
                      {(item: string) => (
                        <ComboboxItem key={item} value={item}>
                          {item}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="version"
            render={({ field }) => (
              <FormItem className="col-span-1 md:col-span-2 lg:col-span-1">
                <FormLabel className={cn(
                  "text-xs font-bold uppercase tracking-wider text-muted-foreground flex justify-between",
                  form.formState.errors.version && "text-destructive"
                )}>
                  <span>Versão *</span>
                </FormLabel>
                <Combobox
                  items={filteredVersions}
                  value={field.value}
                  inputValue={versionSearch}
                  onInputValueChange={setVersionSearch}
                  onValueChange={field.onChange}
                  disabled={loading || loadingFipe || fipeVersions.length === 0}
                >
                  <FormControl>
                    <ComboboxInput
                      placeholder={loadingFipe ? "Carregando..." : "Selecione a Versão"}
                      className={cn("bg-background/50 rounded-lg h-10 w-full", form.formState.errors.version && "border-destructive ring-1 ring-destructive")}
                    />
                  </FormControl>
                  <ComboboxContent>
                    <ComboboxEmpty>Nenhuma versão encontrada.</ComboboxEmpty>
                    <ComboboxList>
                      {(item: string) => (
                        <ComboboxItem key={item} value={item}>
                          {item}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="plate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={cn(
                  "text-xs font-bold uppercase tracking-wider text-muted-foreground",
                  form.formState.errors.plate && "text-destructive"
                )}>
                  Placa *
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: ABC-1234"
                    {...field}
                    value={field.value ? (field.value.length > 3 ? `${field.value.substring(0, 3)}-${field.value.substring(3, 7)}` : field.value) : ""}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/-/g, "").toUpperCase().substring(0, 7);
                      field.onChange(rawValue);
                    }}
                    className={cn(
                      "uppercase bg-background/50 rounded-lg h-10",
                      form.formState.errors.plate && "border-destructive ring-1 ring-destructive"
                    )}
                    disabled={loading}
                    maxLength={8}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="chassi"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Chassi
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: 9BWZZZ377VT004251"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => {
                      const rawValue = e.target.value
                        .replace(/[^a-zA-Z0-9]/g, "")
                        .toUpperCase()
                        .substring(0, 17);
                      field.onChange(rawValue);
                    }}
                    className="uppercase bg-background/50 rounded-lg h-10"
                    disabled={loading}
                    maxLength={17}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="renavam"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Renavam
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: 12345678901"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/\D/g, "").substring(0, 11);
                      field.onChange(rawValue);
                    }}
                    className="bg-background/50 rounded-lg h-10"
                    disabled={loading}
                    inputMode="numeric"
                    maxLength={11}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={cn(
                  "text-xs font-bold uppercase tracking-wider text-muted-foreground",
                  form.formState.errors.year && "text-destructive"
                )}>
                  Ano Fabr. *
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    value={field.value ?? ""}
                    disabled={loading}
                    className={cn(
                      "bg-background/50 rounded-lg h-10",
                      form.formState.errors.year && "border-destructive ring-1 ring-destructive"
                    )}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="year_model"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={cn(
                  "text-xs font-bold uppercase tracking-wider text-muted-foreground",
                  form.formState.errors.year_model && "text-destructive"
                )}>
                  Ano Modelo *
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    value={field.value ?? ""}
                    disabled={loading}
                    className={cn(
                      "bg-background/50 rounded-lg h-10",
                      form.formState.errors.year_model && "border-destructive ring-1 ring-destructive"
                    )}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Valores e Especificações */}
      <div className="group border rounded-2xl p-6 bg-card/50 shadow-sm hover:shadow-md hover:bg-card transition-all space-y-6 border-primary/5">
        <div className="flex items-center gap-3 border-b border-primary/10 pb-4">
          <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Coins className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight">
              Valores e Especificações
            </h3>
            <p className="text-xs text-muted-foreground">
              Dados técnicos e financeiros do veículo
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FormField
            control={form.control}
            name="purchase_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={cn(
                  "text-xs font-bold uppercase tracking-wider",
                  form.formState.errors.purchase_price && "text-destructive"
                )}>
                  Preço Compra (R$)
                </FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    disabled={loading}
                    placeholder="R$ 0,00"
                    className={cn(
                      "bg-primary/5 border-primary/20 rounded-lg h-10 font-semibold",
                      form.formState.errors.purchase_price && "border-destructive ring-1 ring-destructive"
                    )}
                    value={field.value ? formatCurrency(field.value) : ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Permitir apenas números e pontuação de moeda
                      const numericValue = value.replace(/\D/g, "");
                      if (numericValue) {
                        field.onChange(Number(numericValue) / 100);
                      } else {
                        field.onChange(null);
                      }
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={cn(
                  "text-xs font-bold uppercase tracking-wider text-primary",
                  form.formState.errors.price && "text-destructive"
                )}>
                  Preço Venda (R$) *
                </FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    disabled={loading}
                    placeholder="R$ 0,00"
                    className={cn(
                      "bg-primary/5 border-primary/20 rounded-lg h-10 font-semibold",
                      form.formState.errors.price && "border-destructive ring-1 ring-destructive"
                    )}
                    value={field.value ? formatCurrency(field.value) : ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Permitir apenas números e pontuação de moeda
                      const numericValue = value.replace(/\D/g, "");
                      if (numericValue) {
                        field.onChange(Number(numericValue) / 100);
                      } else {
                        field.onChange(0);
                      }
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fipe"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <span>FIPE (R$)</span>
                  <FormField
                    control={form.control}
                    name="show_fipe_price"
                    render={({ field: showFipeField }) => (
                      <div className="flex items-center gap-2 text-[10px] font-normal text-primary/80">
                        <span>Exibir site</span>
                        <Switch
                          checked={showFipeField.value}
                          onCheckedChange={showFipeField.onChange}
                          disabled={loading}
                        />
                      </div>
                    )}
                  />
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="R$ 0,00"
                      type="text"
                      disabled={loading}
                      className="bg-background/50 rounded-lg h-10"
                      value={field.value ? formatCurrency(field.value) : ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numericValue = value.replace(/\D/g, "");
                        if (numericValue) {
                          field.onChange(Number(numericValue) / 100);
                        } else {
                          field.onChange(0);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="absolute top-1 right-1"
                      onClick={fetchFipePrice}
                      disabled={loading || loadingFipePrice}
                    >
                      {loadingFipePrice ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Search className="h-4 w-4" />}
                    </Button>
                  </div>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mileage"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  KM
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    value={field.value || ""}
                    disabled={loading}
                    className="bg-background/50 rounded-lg h-10"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="engine_size"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Motorização
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: 2.0"
                    {...field}
                    value={field.value || ""}
                    disabled={loading}
                    className="bg-background/50 rounded-lg h-10"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="horsepower"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Potência (cv)
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    value={field.value || ""}
                    disabled={loading}
                    className="bg-background/50 rounded-lg h-10"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fuel"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={cn(
                  "text-xs font-bold uppercase tracking-wider text-muted-foreground",
                  form.formState.errors.fuel && "text-destructive"
                )}>
                  Combustível *
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={loading}
                >
                  <FormControl>
                    <SelectTrigger className={cn(
                      "bg-background/50 rounded-lg border-primary/10 hover:border-primary transition-colors h-10",
                      form.formState.errors.fuel && "border-destructive ring-1 ring-destructive"
                    )}>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent alignItemWithTrigger={false}>
                    <SelectItem value="Flex">Flex</SelectItem>
                    <SelectItem value="Gasolina">Gasolina</SelectItem>
                    <SelectItem value="Etanol">Etanol</SelectItem>
                    <SelectItem value="Diesel">Diesel</SelectItem>
                    <SelectItem value="Híbrido">Híbrido</SelectItem>
                    <SelectItem value="Elétrico">Elétrico</SelectItem>
                    <SelectItem value="Elétrico/Gasolina">Elétrico/Gasolina</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="transmission"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={cn(
                  "text-xs font-bold uppercase tracking-wider text-muted-foreground",
                  form.formState.errors.transmission && "text-destructive"
                )}>
                  Transmissão *
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={loading}
                >
                  <FormControl>
                    <SelectTrigger className={cn(
                      "bg-background/50 rounded-lg border-primary/10 hover:border-primary transition-colors h-10",
                      form.formState.errors.transmission && "border-destructive ring-1 ring-destructive"
                    )}>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent alignItemWithTrigger={false}>
                    <SelectItem value="Manual">Manual</SelectItem>
                    <SelectItem value="Automático">Automático</SelectItem>
                    <SelectItem value="CVT">CVT</SelectItem>
                    <SelectItem value="Automatizado">Automatizado</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={cn(
                  "text-xs font-bold uppercase tracking-wider text-muted-foreground",
                  form.formState.errors.color && "text-destructive"
                )}>
                  Cor *
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Branco"
                    {...field}
                    disabled={loading}
                    className={cn(
                      "bg-background/50 rounded-lg h-10",
                      form.formState.errors.color && "border-destructive ring-1 ring-destructive"
                    )}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {form.watch("type") !== "motorcycles" && (
            <FormField
              control={form.control}
              name="doors"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={cn(
                    "text-xs font-bold uppercase tracking-wider text-muted-foreground",
                    form.formState.errors.doors && "text-destructive"
                  )}>
                    Portas *
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      disabled={loading}
                      className={cn(
                        "bg-background/50 rounded-lg h-10",
                        form.formState.errors.doors && "border-destructive ring-1 ring-destructive"
                      )}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="body_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={cn(
                  "text-xs font-bold uppercase tracking-wider text-muted-foreground",
                  form.formState.errors.body_type && "text-destructive"
                )}>
                  Carroceria *
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={loading}
                >
                  <FormControl>
                    <SelectTrigger className={cn(
                      "bg-background/50 rounded-lg border-primary/10 hover:border-primary transition-colors h-10",
                      form.formState.errors.body_type && "border-destructive ring-1 ring-destructive"
                    )}>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent alignItemWithTrigger={false}>
                    <SelectItem value="Sedan">Sedan</SelectItem>
                    <SelectItem value="Hatch">Hatch</SelectItem>
                    <SelectItem value="SUV">SUV</SelectItem>
                    <SelectItem value="Picape">Picape</SelectItem>
                    <SelectItem value="Coupe">Coupe</SelectItem>
                    <SelectItem value="Conversível">Conversível</SelectItem>
                    <SelectItem value="Van">Van</SelectItem>
                    <SelectItem value="Moto">Moto</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Características */}
      <div className="group border rounded-2xl p-6 bg-card/50 shadow-sm hover:shadow-md hover:bg-card transition-all space-y-6 border-primary/5">
        <div className="flex items-center gap-3 border-b border-primary/10 pb-4">
          <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Cog className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight">Características</h3>
            <p className="text-xs text-muted-foreground">
              Características do veículo
            </p>
          </div>

        </div>        <FormField
          control={form.control}
          name="features"
          render={({ field }) => (
            <div className="space-y-2">
              <p className="ml-2 text-xs text-muted-foreground italic">
                Digite e pressione Enter para adicionar uma característica
              </p>
              <FormItem>
                <FormControl>
                  <TagInput
                    value={field.value}
                    onChange={field.onChange}
                    disabled={loading}
                    placeholder="Ex: Teto Solar, Banco de Couro, Câmera de Ré..."
                  />
                </FormControl>
              </FormItem>
            </div>
          )}
        />
      </div>
      {/* Localização */}
      <div className="group border rounded-2xl p-6 bg-card/50 shadow-sm hover:shadow-md hover:bg-card transition-all space-y-6 border-primary/5">
        <div className="flex items-center gap-3 border-b border-primary/10 pb-4">
          <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight">Localização</h3>
            <p className="text-xs text-muted-foreground">
              Onde o veículo está fisicamente disponível
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={cn(
                  "text-xs font-bold uppercase tracking-wider text-muted-foreground",
                  form.formState.errors.city && "text-destructive"
                )}>
                  Cidade *
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: São Paulo"
                    {...field}
                    disabled={loading}
                    className={cn(
                      "bg-background/50 rounded-lg h-10",
                      form.formState.errors.city && "border-destructive ring-1 ring-destructive"
                    )}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={cn(
                  "text-xs font-bold uppercase tracking-wider text-muted-foreground",
                  form.formState.errors.state && "text-destructive"
                )}>
                  Estado (UF) *
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: SP"
                    maxLength={2}
                    {...field}
                    className={cn(
                      "uppercase bg-background/50 rounded-lg h-10",
                      form.formState.errors.state && "border-destructive ring-1 ring-destructive"
                    )}
                    disabled={loading}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}


function MarketplaceTab({ form, loading, onGenerateAI, generatingAI, aiStats }: { form: any; loading: boolean; onGenerateAI?: () => void; generatingAI?: boolean; aiStats?: any }) {
  return (
    <div className="flex flex-col gap-8 p-1">
      {/* Vendedor e Publicação Section */}
      <div className="group border rounded-2xl p-6 bg-card/50 shadow-sm hover:shadow-md hover:bg-card transition-all space-y-6 border-primary/5">
        <div className="flex items-center gap-3 border-b border-primary/10 pb-4">
          <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight">Vendedor e Descrição</h3>
            <p className="text-xs text-muted-foreground">Descreva o veículo e o vendedor</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="seller"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Vendedor *</FormLabel>
                <FormControl>
                  <Input placeholder="Nome do vendedor" {...field} disabled={loading} className="bg-background/50 h-10 rounded-lg" />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="seller_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tipo de Vendedor *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value === "dealership" ? "Concessionária" : field.value === "store" ? "Loja" : field.value === "private" ? "Particular" : ""} disabled={loading}>
                  <FormControl>
                    <SelectTrigger className="bg-background/50 h-10 rounded-lg">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent alignItemWithTrigger={false}>
                    <SelectItem value="dealership">Concessionária</SelectItem>
                    <SelectItem value="store">Loja</SelectItem>
                    <SelectItem value="private">Particular</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <div className="col-span-2">

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Descrição Original / Manual *
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva detalhes adicionais..."
                      className="min-h-[120px] bg-background/50 rounded-xl border-primary/10"
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>

      {/* Descrição e IA Section */}
      <div className="group border rounded-2xl p-6 bg-card/50 shadow-sm hover:shadow-md hover:bg-card transition-all space-y-6 border-primary/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-primary/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">Descrição de IA</h3>
              <p className="text-xs text-muted-foreground">Texto descritivo otimizado por IA para conversão</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {aiStats && (
              <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider leading-none">Cota de IA</span>
                <span className="text-xs font-medium">
                  {aiStats.used} / {aiStats.limit} <span className="text-muted-foreground ml-0.5">usadas</span>
                </span>
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl border-primary/20 hover:bg-primary/10 gap-2 h-9 shadow-sm"
              onClick={onGenerateAI}
              disabled={loading || generatingAI || (aiStats && aiStats.remaining <= 0)}
            >
              {generatingAI ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <Sparkles className="h-4 w-4 text-primary" />
              )}
              {form.watch("ai_description") ? "Regenerar com IA" : "Gerar com IA"}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <FormField
            control={form.control}
            name="enable_ai_description"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 bg-muted/20 border-primary/10 transition-colors hover:bg-muted/30">
                <div className="space-y-0.5">
                  <FormLabel className="text-sm font-bold flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    Utilizar Descrição Gerada por IA
                  </FormLabel>
                  <FormDescription className="text-xs">
                    Ative para usar o texto otimizado no anúncio.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={loading || !form.watch("ai_description")}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-6">
            <FormField
              control={form.control}
              name="ai_description"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-primary/70">
                      Sugestão da IA
                    </FormLabel>
                    {field.value && (
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase">Pronto</span>
                    )}
                  </div>
                  <FormControl>
                    <AIDescriptionBox
                      text={field.value || ""}
                      isGenerating={generatingAI}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

          </div>
        </div>
      </div>
    </div>
  );
}

function ImageCard({
  image,
  index = 0,
  mainImageUrl,
  onDelete,
  onSetMain,
  deletingId,
  isPlaceholder = false,
  isOverlay = false,
  showControls = false,
  onToggleControls,
}: {
  image: any;
  index?: number;
  mainImageUrl: string;
  onDelete?: (id: string) => void;
  onSetMain?: (url: string) => void;
  deletingId?: string | null;
  isPlaceholder?: boolean;
  isOverlay?: boolean;
  showControls?: boolean;
  onToggleControls?: () => void;
}) {
  const status = image.status || "success";
  const progress = image.progress || 0;
  const isLocal = image.isLocal;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (!isOverlay) onToggleControls?.();
      }}
      className={cn(
        "relative group aspect-square rounded-2xl overflow-hidden border bg-muted/30 transition-all duration-300 cursor-pointer",
        isOverlay
          ? "shadow-2xl scale-105 z-50 cursor-grabbing border-primary/50"
          : "hover:border-primary/30",
        isPlaceholder && "opacity-0",
        showControls && "border-primary/50 ring-2 ring-primary/20",
      )}
    >
      <img
        src={image.url || image.image_url}
        alt="Vehicle"
        className={cn(
          "h-full w-full object-cover transition-transform duration-500",
          !isOverlay && "group-hover:scale-110",
        )}
      />

      {/* Badges */}
      <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none z-20">
        <div className="bg-primary/95 backdrop-blur-md text-[10px] font-bold text-primary-foreground px-2 py-0.5 rounded-full shadow-lg border border-white/10 uppercase tracking-wider w-fit">
          {index + 1}º
        </div>
        {mainImageUrl === image.url && (
          <div className="bg-emerald-500/95 backdrop-blur-md text-[10px] font-bold text-white px-2 py-0.5 rounded-full shadow-lg border border-white/10 uppercase tracking-wider w-fit">
            Principal
          </div>
        )}
        {isLocal && (
          <div className="bg-blue-500/95 backdrop-blur-md text-[10px] font-bold text-white px-2 py-0.5 rounded-full shadow-lg border border-white/10 uppercase tracking-wider w-fit">
            Novo
          </div>
        )}
      </div>

      {/* Status Overlay for Local Images */}
      {isLocal && (
        <div
          className={cn(
            "absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 transition-opacity z-10",
            status === "success" ? "opacity-0 pointer-events-none" : "opacity-100",
          )}
        >
          {status === "uploading" && (
            <div className="w-full space-y-2">
              <div className="flex justify-between text-[10px] text-white font-medium uppercase tracking-tight">
                <span>Enviando...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-1 bg-white/20" />
            </div>
          )}
          {status === "error" && (
            <div className="flex flex-col items-center gap-1 text-white">
              <div className="p-1.5 rounded-full bg-destructive/20 text-destructive border border-destructive/30">
                <AlertCircle className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold uppercase text-destructive-foreground">Erro</span>
            </div>
          )}
        </div>
      )}

      {/* Controls */}
      {!isOverlay && !isLocal && (
        <div className={cn(
          "absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent transition-all duration-300 flex items-end justify-between gap-1 p-3 z-30",
          "lg:opacity-0 lg:group-hover:opacity-100 lg:pointer-events-none lg:group-hover:pointer-events-auto",
          showControls ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 lg:h-8 lg:w-8 rounded-lg bg-white/10 hover:bg-destructive hover:text-white transition-colors text-white/90 border border-white/10 backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(image.id);
            }}
            disabled={!!deletingId}
          >
            {deletingId === image.id ? (
              <Loader2 className="h-2 w-2 lg:h-3.5 lg:w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-2 w-2 lg:h-3.5 lg:w-3.5" />
            )}
          </Button>

          {mainImageUrl !== image.url && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-5 lg:h-8 py-1 lg:py-1.5 px-1 lg:px-3 rounded-lg bg-white/10 hover:bg-primary hover:text-primary-foreground transition-colors text-white/90 border border-white/10 backdrop-blur-sm text-[10px] lg:text-[10px] font-bold uppercase tracking-wide"
              onClick={(e) => {
                e.stopPropagation();
                onSetMain?.(image.url);
              }}
            >
              Principal
            </Button>
          )}
        </div>
      )}

      {/* Remove local image before upload */}
      {!isOverlay && isLocal && status === 'idle' && (
        <div className={cn(
          "absolute top-2 right-2 z-30 transition-opacity",
          "lg:opacity-0 lg:group-hover:opacity-100 lg:pointer-events-none lg:group-hover:pointer-events-auto",
          showControls ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="h-6 w-6 rounded-full shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(image.id);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

function SortableImage({
  image,
  index,
  mainImageUrl,
  onDelete,
  onSetMain,
  deletingId,
  selectedImageId,
  onToggleControls,
}: {
  image: any;
  index: number;
  mainImageUrl: string;
  onDelete: (id: string) => void;
  onSetMain: (url: string) => void;
  deletingId: string | null;
  selectedImageId: string | null;
  onToggleControls: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    touchAction: "none",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="cursor-grab active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <ImageCard
        image={image}
        index={index}
        mainImageUrl={mainImageUrl}
        onDelete={onDelete}
        onSetMain={onSetMain}
        deletingId={deletingId}
        isPlaceholder={isDragging}
        showControls={selectedImageId === image.id}
        onToggleControls={() => onToggleControls(image.id)}
      />
    </div>
  );
}

function VideoCard({
  videoUrl,
  type,
  onDelete,
  deleting,
}: {
  videoUrl: string;
  type: "shorts" | "wide";
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div className={cn(
      "relative group rounded-2xl overflow-hidden border bg-muted/30 transition-all duration-300",
      type === "shorts" ? "aspect-9/16 max-w-[280px] mx-auto" : "aspect-video w-full"
    )}>
      <video
        src={videoUrl}
        className="h-full w-full object-cover"
        controls
        controlsList="nodownload"
      />

      <div className="absolute top-2 left-2 flex flex-col gap-1 z-20 pointer-events-none">
        <div className="bg-primary/95 backdrop-blur-md text-[10px] font-bold text-primary-foreground px-2 py-0.5 rounded-full shadow-lg border border-white/10 uppercase tracking-wider w-fit">
          {type === "shorts" ? "Short (Mobile)" : "Apresentação (Web)"}
        </div>
      </div>

      <div className="absolute top-2 right-2 z-30 transition-opacity lg:opacity-0 lg:group-hover:opacity-100 opacity-100">
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="h-8 w-8 rounded-lg shadow-lg"
          onClick={onDelete}
          disabled={deleting}
        >
          {deleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

interface InstagramReelOption {
  id: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  caption?: string;
  timestamp?: string;
}

function VideoUploader({ vehicleId, type }: { vehicleId: string; type: "shorts" | "wide" }) {
  const [videoFile, setVideoFile] = useState<{ id?: string, url: string; path: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [instagramReelUrl, setInstagramReelUrl] = useState("");
  const [importingReel, setImportingReel] = useState(false);
  const [reelDialogOpen, setReelDialogOpen] = useState(false);
  const [loadingReels, setLoadingReels] = useState(false);
  const [reels, setReels] = useState<InstagramReelOption[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const folderPath = `${vehicleId}/videos/${type}`;

  const fetchVideo = async () => {
    if (!vehicleId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/vehicles/videos?vehicleId=${vehicleId}`);
      if (!response.ok) throw new Error("Falha ao buscar vídeos no banco");
      const videos = await response.json();
      const videoRecord = videos.find((v: { id: string; url: string; type: string }) => v.type === type);

      if (videoRecord) {
        // Obter o path do bucket através da decodificação da URL pública do supabase (removendo a base URL até o final do nome do bucket)
        const pathMatch = videoRecord.url.match(/vehicles\/(.+)/);
        const path = pathMatch ? decodeURIComponent(pathMatch[1]) : `${folderPath}/`;

        setVideoFile({ id: videoRecord.id, url: videoRecord.url, path });
      } else {
        setVideoFile(null);
      }
    } catch (err) {
      console.error(`Error fetching ${type} video:`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideo();
  }, [vehicleId, type]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Por favor, selecione um arquivo de vídeo válido.");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.error("O vídeo deve ter no máximo 100MB.");
      return;
    }

    try {
      setUploading(true);

      // Remove previously existing video to keep max 1 constraint
      if (videoFile?.path) {
        await supabase.storage.from("vehicles").remove([videoFile.path]);
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${folderPath}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('vehicles')
        .upload(filePath, file, {
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('vehicles')
        .getPublicUrl(filePath);

      // Register the video in our DB via API
      const apiResponse = await fetch('/api/vehicles/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicle_id: vehicleId,
          url: publicUrl,
          type
        }),
      });

      if (!apiResponse.ok) {
        throw new Error("Falha ao registrar vídeo na base de dados");
      }

      const record = await apiResponse.json();

      setVideoFile({ id: record.id, url: publicUrl, path: filePath });
      toast.success(`Vídeo ${type === 'shorts' ? 'Short' : 'de Apresentação'} enviado com sucesso!`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Erro ao subir o vídeo.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    if (!videoFile?.path) return;

    try {
      setDeleting(true);

      // Delete from DB first
      if (videoFile.id) {
        const response = await fetch(`/api/vehicles/videos?id=${videoFile.id}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error("Erro ao remover registro do banco");
      }

      // Delete from Storage
      const { error } = await supabase.storage.from("vehicles").remove([videoFile.path]);
      if (error) throw error;

      setVideoFile(null);
      toast.success("Vídeo removido com sucesso!");
    } catch (error) {
      console.error('Delete error:', error);
      toast.error("Erro ao deletar o vídeo.");
    } finally {
      setDeleting(false);
    }
  };

  const importInstagramReel = async (postUrl: string) => {
    if (!vehicleId) {
      toast.error("Salve o veiculo antes de importar um short.");
      return;
    }

    const trimmedUrl = postUrl.trim();
    if (!trimmedUrl) {
      toast.error("Informe o link do short do Instagram.");
      return;
    }

    const loadingToast = toast.loading("Importando shorts...");

    try {
      setImportingReel(true);
      setReelDialogOpen(false);

      const response = await fetch("/api/instagram/import-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postUrl: trimmedUrl,
          vehicleId,
          type: "shorts",
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Nao foi possivel importar o short do Instagram.");
      }

      setVideoFile({
        id: result.video.id,
        url: result.video.url,
        path: result.video.path,
      });
      setInstagramReelUrl("");
      toast.success("Short importado com sucesso!", { id: loadingToast });
    } catch (error) {
      console.error("Instagram reel import error:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao importar short do Instagram.", {
        id: loadingToast,
      });
    } finally {
      setImportingReel(false);
    }
  };

  const loadInstagramReels = async () => {
    if (!vehicleId) {
      toast.error("Salve o veiculo antes de selecionar um short.");
      return;
    }

    setReelDialogOpen(true);
    setLoadingReels(true);

    try {
      const response = await fetch("/api/instagram/reels", { cache: "no-store" });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Nao foi possivel listar os shorts do Instagram.");
      }

      setReels(result.reels || []);
    } catch (error) {
      console.error("Instagram reels list error:", error);
      setReels([]);
      toast.error(error instanceof Error ? error.message : "Erro ao carregar shorts do Instagram.");
    } finally {
      setLoadingReels(false);
    }
  };

  if (loading) {
    return (
      <div className={cn(
        "flex bg-muted/20 items-center justify-center border rounded-2xl h-40",
        type === "shorts" ? "max-w-[280px] mx-auto aspect-9/16 h-auto" : "w-full aspect-video h-auto"
      )}>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 border rounded-2xl p-6 bg-card/50 shadow-sm hover:shadow-md transition-all border-primary/5">
      <div className="flex items-center gap-3 border-b border-primary/10 pb-4">
        <div className="p-2 rounded-xl bg-primary/10 text-primary">
          {type === 'shorts' ? <Smartphone className="h-5 w-5" /> : <MonitorPlay className="h-5 w-5" />}
        </div>
        <div>
          <h4 className="text-md font-bold tracking-tight">
            {type === 'shorts' ? 'Vídeo Short (Vertical)' : 'Vídeo de Apresentação (Horizontal)'}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {type === 'shorts' ? 'Vídeo curto para visualização em formato mobile.' : 'Vídeo completo para a galeria do veículo.'}
          </p>
        </div>
      </div>

      {type === "shorts" && (
        <div className="rounded-2xl border border-primary/10 bg-muted/20 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Instagram className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Importar short do Instagram</span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={instagramReelUrl}
              onChange={(event) => setInstagramReelUrl(event.target.value)}
              placeholder="https://www.instagram.com/reel/SHORTCODE/"
              disabled={importingReel}
              className="h-10"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={loadInstagramReels}
                disabled={importingReel}
                className="h-10 whitespace-nowrap"
              >
                {loadingReels ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Instagram className="mr-2 h-4 w-4" />
                )}
                Selecionar short
              </Button>
              <Button
                type="button"
                onClick={() => importInstagramReel(instagramReelUrl)}
                disabled={importingReel || !instagramReelUrl.trim()}
                className="h-10 whitespace-nowrap"
              >
                {importingReel && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Importar
              </Button>
            </div>
          </div>
        </div>
      )}

      {type === "shorts" && importingReel && (
        <div className="flex items-center gap-2 rounded-xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm font-medium text-primary">
          <Loader2 className="h-4 w-4 animate-spin" />
          Importando shorts...
        </div>
      )}

      {videoFile ? (
        <>
          <VideoCard
            videoUrl={videoFile.url}
            type={type}
            onDelete={() => setShowDeleteAlert(true)}
            deleting={deleting}
          />

          <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
            <AlertDialogContent className="rounded-3xl border-primary/10 shadow-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-bold flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  Confirmar Exclusão
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm py-2">
                  Tem certeza que deseja remover este vídeo? Esta ação não pode ser
                  desfeita e o arquivo será excluído permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-3 sm:gap-4 mt-2">
                <AlertDialogCancel
                  onClick={() => setShowDeleteAlert(false)}
                  className="rounded-xl border-primary/10 hover:bg-muted transition-colors px-6"
                >
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-colors shadow-lg shadow-destructive/20 px-6"
                  onClick={() => {
                    setShowDeleteAlert(false);
                    handleDelete();
                  }}
                >
                  Excluir Permanentemente
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : (
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center border-2 border-dashed border-primary/20 rounded-2xl bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer",
            uploading && "opacity-50 pointer-events-none",
            type === "shorts" ? "aspect-9/16 max-w-[280px] mx-auto w-full" : "aspect-video w-full h-[280px]"
          )}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-3 text-primary">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-sm font-semibold">Enviando vídeo...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-muted-foreground p-6 text-center">
              <div className="p-4 rounded-full bg-primary/10 text-primary shadow-sm">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <span className="text-sm font-bold block mb-1 text-foreground">Clique para selecionar o vídeo</span>
                <span className="text-xs">MP4, WebM (Máx 100MB)</span>
              </div>
            </div>
          )}
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept="video/mp4,video/webm,video/quicktime"
      />

      {type === "shorts" && (
        <Dialog open={reelDialogOpen} onOpenChange={setReelDialogOpen}>
          <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>Selecionar short do Instagram</DialogTitle>
              <DialogDescription>
                Escolha um reel da conta conectada para importar como video short vertical.
              </DialogDescription>
            </DialogHeader>

            {loadingReels ? (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Carregando shorts...
              </div>
            ) : reels.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-center text-sm text-muted-foreground">
                <Video className="h-8 w-8" />
                Nenhum short foi encontrado na conta conectada.
              </div>
            ) : (
              <ScrollArea className="max-h-[60vh] pr-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {reels.map((reel) => {
                    const previewUrl = reel.thumbnail_url || reel.media_url;

                    return (
                      <button
                        key={reel.id}
                        type="button"
                        onClick={() => importInstagramReel(reel.permalink)}
                        disabled={importingReel}
                        className="group overflow-hidden rounded-xl border bg-card text-left transition hover:border-primary disabled:pointer-events-none disabled:opacity-60"
                      >
                        <div className="relative aspect-9/16 bg-muted">
                          {previewUrl ? (
                            <div
                              aria-label={reel.caption || "Short do Instagram"}
                              className="h-full w-full bg-cover bg-center transition group-hover:scale-105"
                              role="img"
                              style={{ backgroundImage: `url(${previewUrl})` }}
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground">
                              <Video className="h-8 w-8" />
                            </div>
                          )}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                            <span className="line-clamp-2 text-xs font-medium text-white">
                              {reel.caption || reel.permalink}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function MediaTab({
  vehicleId,
  form,
  images,
  onImagesChange,
  onImageDeleted,
  loading,
}: {
  vehicleId?: string;
  form: any;
  images: any[];
  onImagesChange: (value: any[] | ((prev: any[]) => any[])) => void;
  onImageDeleted: (id: string) => void;
  loading: boolean;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [mixedImages, setMixedImages] = useState<any[]>(images);
  const [uploading, setUploading] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mainImageUrl = form.watch("image");
  const [dragActive, setDragActive] = useState(false);
  const dragCounter = useRef(0);

  // Sync mixedImages with props when images change (from DB)
  useEffect(() => {
    setMixedImages(prev => {
      const normalizedImages = images.map(img => ({
        ...img,
        url: img.url || img.image_url // Ensure .url exists for consistent display
      }));

      // Filter local images: only keep those that aren't already represented in the incoming list
      // Check both ID (since success merges the UUID) and URL
      const trulyLocal = prev.filter(p => {
        if (!p.isLocal) return false;
        return !normalizedImages.some(img => img.id === p.id || img.image_url === p.image_url);
      });

      return [...normalizedImages, ...trulyLocal];
    });
  }, [images]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = mixedImages.findIndex((img) => img.id === active.id);
      const newIndex = mixedImages.findIndex((img) => img.id === over.id);

      const newOrder = arrayMove(mixedImages, oldIndex, newIndex);
      setMixedImages(newOrder);

      // If none of the moving images are local, we can notify parent immediately
      // Otherwise, we wait for upload to notify parent of the total order
      if (!newOrder.some(img => img.isLocal)) {
        onImagesChange(newOrder);
      }
    }

    setActiveId(null);
  };

  const processFiles = (files: FileList | File[]) => {
    const newLocalImages = Array.from(files)
      .filter(file => file.type.startsWith('image/'))
      .map(file => ({
        id: Math.random().toString(36).substring(7),
        url: URL.createObjectURL(file),
        file,
        progress: 0,
        status: 'idle',
        isLocal: true
      }));

    if (newLocalImages.length > 0) {
      setMixedImages(prev => [...prev, ...newLocalImages]);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    processFiles(files);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter") {
      dragCounter.current++;
      setDragActive(true);
    } else if (e.type === "dragleave") {
      dragCounter.current--;
      if (dragCounter.current === 0) {
        setDragActive(false);
      }
    } else if (e.type === "dragover") {
      setDragActive(true);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    dragCounter.current = 0;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const refreshImages = async () => {
    if (!vehicleId) return;
    try {
      const res = await fetch(`/api/vehicles/images?vehicleId=${vehicleId}`);
      if (res.ok) {
        const data = await res.json();
        onImagesChange(data);
      }
    } catch (err) {
      console.error("Error refreshing images:", err);
    }
  };

  const handleInstagramImported = async (imported: InstagramImportedImage[]) => {
    const importedVehicleImages = imported
      .map((item) => item.vehicleImage)
      .filter(Boolean);

    if (importedVehicleImages.length > 0) {
      onImagesChange((prev) => [...prev, ...importedVehicleImages]);

      const firstImported = importedVehicleImages[0] as { image_url?: string; url?: string };
      if (!form.getValues("image") && (firstImported.image_url || firstImported.url)) {
        form.setValue("image", firstImported.image_url || firstImported.url);
      }
    }

    await refreshImages();
  };

  const uploadImages = async () => {
    const pendingImages = mixedImages.filter(img => img.isLocal && img.status !== 'success');
    if (pendingImages.length === 0) return;

    setUploading(true);
    const supabase = createClient();

    for (const image of pendingImages) {
      try {
        // Update status to uploading
        setMixedImages(prev => prev.map(img =>
          img.id === image.id ? { ...img, status: 'uploading', progress: 10 } : img
        ));

        // 1. Compression
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          onProgress: (progress: number) => {
            setMixedImages(prev => prev.map(img =>
              img.id === image.id ? { ...img, progress: 10 + (progress * 0.2) } : img
            ));
          }
        };

        const compressedFile = await imageCompression(image.file!, options);

        // 2. Upload to Storage
        const fileExt = image.file!.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${vehicleId}/images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('vehicles')
          .upload(filePath, compressedFile, {
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
          .from('vehicles')
          .getPublicUrl(filePath);

        // 3. Save to Database
        const response = await fetch('/api/vehicles/images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vehicle_id: vehicleId,
            image_url: publicUrl,
            sort_order: mixedImages.findIndex(img => img.id === image.id),
            active: true
          })
        });

        if (!response.ok) throw new Error('Falha ao salvar no banco');
        const savedImage = await response.json();

        // Update form's main image if empty
        if (!form.getValues('image')) {
          form.setValue('image', publicUrl);
        }

        // Update local mixedImages status, keep in local state for progress feedback
        setMixedImages(prev => prev.map(img =>
          img.id === image.id ? { ...img, ...savedImage, status: 'success', progress: 100 } : img
        ));

      } catch (error) {
        console.error('Upload error:', error);
        setMixedImages(prev => prev.map(img =>
          img.id === image.id ? { ...img, status: 'error' } : img
        ));
        toast.error(`Erro ao subir imagem: ${image.file?.name}`);
      }
    }

    await refreshImages();
    setUploading(false);
    toast.success('Upload concluído!');
  };

  const activeImage = activeId ? mixedImages.find((i) => i.id === activeId) : null;
  const activeIndex = activeId ? mixedImages.findIndex((i) => i.id === activeId) : -1;
  const hasLocalImages = mixedImages.some(img => img.isLocal);

  const handleDelete = async (id: string) => {
    // Local image deletion
    if (mixedImages.find(img => img.id === id)?.isLocal) {
      setMixedImages(prev => prev.filter(img => img.id !== id));
      return;
    }

    setDeletingId(id);
    setConfirmDeleteId(null);
    try {
      const response = await fetch(`/api/vehicles/images?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Falha ao deletar imagem");

      onImageDeleted(id);
      toast.success("Imagem removida com sucesso");
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("Erro ao deletar imagem");
    } finally {
      setDeletingId(null);
    }
  };

  if (!vehicleId && images.length === 0) {
    return (
      <div className="flex flex-col gap-6 p-1 h-full items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-6 max-w-md text-center">
          <div className="p-6 rounded-full bg-primary/5 text-primary/40 border border-primary/10 shadow-inner">
            <ImageIcon className="h-16 w-16" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold tracking-tight">Galeria de Mídia</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Salve o veículo primeiro para começar a gerenciar sua galeria de fotos.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-8 p-1 relative min-h-[500px]"
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {/* Drag & Drop Overlay */}
      {dragActive && (
        <div className="absolute w-full h-full inset-x-[-4px] inset-y-[-4px] z-50 rounded-3xl bg-primary/10 backdrop-blur-[6px] border-2 border-dashed border-primary/40 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-200">
          <div className="bg-background/90 p-8 rounded-full shadow-2xl border-2 border-primary/20 mb-6 transform transition-transform hover:scale-110">
            <Plus className="h-12 w-12 text-primary animate-bounce font-bold" />
          </div>
          <p className="text-2xl font-bold text-primary tracking-tight">Solte as imagens aqui</p>
          <p className="text-sm text-primary/70 mt-2 font-medium">As fotos serão adicionadas automaticamente à galeria</p>
        </div>
      )}

      {/* Seção de Fotos */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-primary/10 pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shadow-sm">
              <Camera className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-md font-bold tracking-tight">Galeria de Fotos</h3>
              <p className="text-xs text-muted-foreground">
                {mixedImages.length}{" "}
                {mixedImages.length === 1 ? "imagem encontrada" : "imagens encontradas"}{" "}
                para este veículo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              multiple
              accept="image/*"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl border-primary/20 hover:bg-primary/5 gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar Imagens
            </Button>

            {hasLocalImages && (
              <Button
                type="button"
                size="sm"
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg shadow-blue-500/20"
                onClick={uploadImages}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                Realizar Upload
              </Button>
            )}
          </div>
        </div>

        <InstagramImporter
          vehicleId={vehicleId}
          disabled={loading}
          startSortOrder={mixedImages.length}
          onImported={handleInstagramImported}
        />

        <div>

          {mixedImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 border-2 border-dashed rounded-3xl border-primary/10 bg-muted/5">
              <ImageIcon className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-sm text-dotted text-muted-foreground font-medium text-center">
                Nenhuma foto adicional encontrada.
                <br />
                As fotos enviadas aparecerão aqui.
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[snapCenterToCursor]}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={mixedImages.map((img) => img.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {mixedImages.map((image, index) => (
                    <SortableImage
                      key={image.id}
                      image={image}
                      index={index}
                      mainImageUrl={mainImageUrl}
                      onDelete={(id) => {
                        const img = mixedImages.find(i => i.id === id);
                        if (img?.isLocal) {
                          handleDelete(id);
                        } else {
                          setConfirmDeleteId(id);
                        }
                      }}
                      onSetMain={(url) => {
                        form.setValue("image", url);
                        toast.success("Foto principal atualizada!");
                      }}
                      deletingId={deletingId}
                      selectedImageId={selectedImageId}
                      onToggleControls={(id) => {
                        setSelectedImageId(prev => (prev === id ? null : id));
                      }}
                    />
                  ))}
                </div>
              </SortableContext>

              <DragOverlay
                modifiers={[restrictToWindowEdges]}
                dropAnimation={{
                  sideEffects: defaultDropAnimationSideEffects({
                    styles: {
                      active: {
                        opacity: "0.5",
                      },
                    },
                  }),
                }}
              >
                {activeImage ? (
                  <ImageCard
                    image={activeImage}
                    index={activeIndex}
                    mainImageUrl={mainImageUrl}
                    isOverlay
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          )}

          {/* Info Card */}
          <div className="mt-4 py-2 px-2 rounded-2xl bg-linear-to-br from-primary/5 to-transparent border border-primary/10 flex items-start gap-4">
            <div className="p-2 rounded-lg bg-background shadow-sm mt-1">
              <Info className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold">Gerenciamento de Imagens</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                As imagens selecionadas localmente podem ser reordenadas antes do envio. Clique em &quot;Realizar Upload&quot; para salvar permanentemente.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Dica: Arraste novas imagens para dentro da janela e adicione-as ao veículo.
              </p>
            </div>
          </div>

          {/* Delete Confirmation Dialog */}
          <AlertDialog
            open={!!confirmDeleteId}
            onOpenChange={(open: boolean) => !open && setConfirmDeleteId(null)}
          >
            <AlertDialogContent className="rounded-3xl border-primary/10 shadow-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-bold flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  Confirmar Exclusão
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm py-2">
                  Tem certeza que deseja remover esta imagem? Esta ação não pode ser
                  desfeita e a foto será excluída permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-3 sm:gap-4 mt-2">
                <AlertDialogCancel
                  className="rounded-xl border-primary/10 hover:bg-muted transition-colors px-6"
                  onClick={() => setConfirmDeleteId(null)}
                >
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-colors shadow-lg shadow-destructive/20 px-6"
                  onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
                >
                  Excluir Permanentemente
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Seção de Vídeos */}
      <div className="space-y-6 mt-4">
        <div className="flex items-center gap-3 border-b border-primary/10 pb-2">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary shadow-sm">
            <Video className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-md font-bold tracking-tight">Galeria de Vídeos</h3>
            <p className="text-xs text-muted-foreground">
              Vídeos curtos e de apresentação do veículo
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <VideoUploader vehicleId={vehicleId || ""} type="shorts" />
          <VideoUploader vehicleId={vehicleId || ""} type="wide" />
        </div>
      </div>
    </div>
  );
}
