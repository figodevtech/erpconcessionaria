import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
  FormMessage,
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
  ExternalLink,
  ChevronDown,
  ChevronUp,
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

const vehicleSchema = z.object({
  brand: z.string().min(1, "Marca é obrigatória"),
  model: z.string().min(1, "Modelo é obrigatório"),
  version: z.string().min(1, "Versão é obrigatória"),
  year: z.coerce
    .number()
    .min(1900)
    .max(new Date().getFullYear() + 1),
  year_model: z.coerce
    .number()
    .min(1900)
    .max(new Date().getFullYear() + 1),
  price: z.coerce.number().min(0),
  fipe: z.coerce.number().optional().nullable(),
  mileage: z.coerce.number().optional().nullable(),
  fuel: z.string().min(1, "Combustível é obrigatório"),
  transmission: z.string().min(1, "Transmissão é obrigatória"),
  color: z.string().min(1, "Cor é obrigatória"),
  doors: z.coerce.number().min(1),
  body_type: z.string().min(1, "Tipo de carroceria é obrigatório"),
  image: z.string().url("URL de imagem inválida").optional().or(z.literal("")),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(1, "Estado é obrigatório"),
  seller: z.string().min(1, "Vendedor é obrigatório"),
  seller_type: z.enum(["dealership", "store", "private"]),
  features: z.array(z.string()).default([]),
  description: z.string().min(1, "Descrição é obrigatória"),
  enable_ai_description: z.boolean().default(false),
  ai_description: z.string().optional().nullable(),
  engine_size: z.string().optional().nullable(),
  horsepower: z.coerce.number().optional().nullable(),
  is_new: z.boolean().default(false),
  status: z.enum(["Em venda", "Vendido", "Rascunho", "Pagamento"]),
  featured: z.boolean().default(false),
  plate: z.string().min(1, "Placa é obrigatória"),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

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
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [vehicleImages, setVehicleImages] = useState<any[]>([]);
  const isEditing = !!vehicle;

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      brand: "",
      model: "",
      version: "",
      year: new Date().getFullYear(),
      year_model: new Date().getFullYear(),
      price: 0,
      fipe: null,
      mileage: null,
      fuel: "Flex",
      transmission: "Automático",
      color: "",
      doors: 4,
      body_type: "SUV",
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
    },
  });

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
            brand: updatedVehicle.brand || "",
            model: updatedVehicle.model || "",
            version: updatedVehicle.version || "",
            year: updatedVehicle.year || new Date().getFullYear(),
            year_model: updatedVehicle.year_model || new Date().getFullYear(),
            price: updatedVehicle.price || 0,
            fipe: updatedVehicle.fipe || null,
            mileage: updatedVehicle.mileage || null,
            fuel: updatedVehicle.fuel || "",
            transmission: updatedVehicle.transmission || "",
            color: updatedVehicle.color || "",
            doors: updatedVehicle.doors || 4,
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
        brand: "",
        model: "",
        version: "",
        year: new Date().getFullYear(),
        year_model: new Date().getFullYear(),
        price: 0,
        fipe: null,
        mileage: null,
        fuel: "Flex",
        transmission: "Automático",
        color: "",
        doors: 4,
        body_type: "SUV",
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
      });
      setVehicleImages([]);
    }
  }, [open, vehicle?.id, form]);

  async function onSubmit(values: VehicleFormValues) {
    setLoading(true);
    try {
      const url = "/api/vehicles";
      const method = isEditing ? "PATCH" : "POST";
      const body = isEditing ? { ...values, id: vehicle.id } : values;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col h-svh w-[100dvw] max-w-[100dvw] p-0 overflow-hidden sm:max-w-[1100px] sm:max-h-[min(90vh,850px)] sm:w-[95vw] border-none shadow-2xl">
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
            onSubmit={form.handleSubmit(onSubmit, (errors) => {
              const messages = Object.values(errors)
                .map((e) => (e as any)?.message)
                .filter(Boolean);
              toast.error("Campos obrigatórios não preenchidos", {
                description: messages.length
                  ? messages.join(" • ")
                  : "Preencha todos os campos obrigatórios.",
                duration: 6000,
              });
            })}
            className="flex flex-col min-h-0 overflow-hidden"
          >
            <Tabs
              defaultValue="Geral"
              className="flex flex-col min-h-0 overflow-hidden pb-0"
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
                  <GeneralTab form={form} loading={loading} />
                </ScrollArea>
              </TabsContent>

              <TabsContent
                className="flex-1 min-h-0 overflow-hidden p-0"
                value="Marketplace"
              >
                <ScrollArea className="h-full px-4 py-6 bg-muted-foreground/5">
                  <MarketplaceTab form={form} loading={loading} />
                </ScrollArea>
              </TabsContent>

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
                      loading={loading}
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
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function GeneralTab({ form, loading }: { form: any; loading: boolean }) {
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
                <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-muted-foreground">
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
                      <SelectItem value="Vendido">Vendido</SelectItem>
                      <SelectItem value="Rascunho">Rascunho</SelectItem>
                      <SelectItem value="Pagamento">Pagamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={cn(
                  "text-xs font-bold uppercase tracking-wider text-muted-foreground",
                  form.formState.errors.brand && "text-destructive"
                )}>
                  Marca *
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Toyota"
                    {...field}
                    disabled={loading}
                    className={cn(
                      "bg-background/50 rounded-lg h-10",
                      form.formState.errors.brand && "border-destructive ring-1 ring-destructive"
                    )}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={cn(
                  "text-xs font-bold uppercase tracking-wider text-muted-foreground",
                  form.formState.errors.model && "text-destructive"
                )}>
                  Modelo *
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Corolla"
                    {...field}
                    disabled={loading}
                    className={cn(
                      "bg-background/50 rounded-lg h-10",
                      form.formState.errors.model && "border-destructive ring-1 ring-destructive"
                    )}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="version"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={cn(
                  "text-xs font-bold uppercase tracking-wider text-muted-foreground",
                  form.formState.errors.version && "text-destructive"
                )}>
                  Versão *
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: XEI 2.0"
                    {...field}
                    disabled={loading}
                    className={cn(
                      "bg-background/50 rounded-lg h-10",
                      form.formState.errors.version && "border-destructive ring-1 ring-destructive"
                    )}
                  />
                </FormControl>
                <FormMessage />
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
                    placeholder="Ex: ABC1234"
                    {...field}
                    className={cn(
                      "uppercase bg-background/50 rounded-lg h-10",
                      form.formState.errors.plate && "border-destructive ring-1 ring-destructive"
                    )}
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
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
                    disabled={loading}
                    className={cn(
                      "bg-background/50 rounded-lg h-10",
                      form.formState.errors.year && "border-destructive ring-1 ring-destructive"
                    )}
                  />
                </FormControl>
                <FormMessage />
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
                    disabled={loading}
                    className={cn(
                      "bg-background/50 rounded-lg h-10",
                      form.formState.errors.year_model && "border-destructive ring-1 ring-destructive"
                    )}
                  />
                </FormControl>
                <FormMessage />
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
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={cn(
                  "text-xs font-bold uppercase tracking-wider text-primary",
                  form.formState.errors.price && "text-destructive"
                )}>
                  Preço (R$) *
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    disabled={loading}
                    className={cn(
                      "bg-primary/5 border-primary/20 rounded-lg h-10 font-semibold",
                      form.formState.errors.price && "border-destructive ring-1 ring-destructive"
                    )}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fipe"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  FIPE (R$)
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    value={field.value || ""}
                    disabled={loading}
                    className="bg-background/50 rounded-lg h-10"
                  />
                </FormControl>
                <FormMessage />
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
                <FormMessage />
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
                <FormMessage />
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
                <FormMessage />
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
                  <SelectContent>
                    <SelectItem value="Flex">Flex</SelectItem>
                    <SelectItem value="Gasolina">Gasolina</SelectItem>
                    <SelectItem value="Etanol">Etanol</SelectItem>
                    <SelectItem value="Diesel">Diesel</SelectItem>
                    <SelectItem value="Híbrido">Híbrido</SelectItem>
                    <SelectItem value="Elétrico">Elétrico</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
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
                  <SelectContent>
                    <SelectItem value="Manual">Manual</SelectItem>
                    <SelectItem value="Automático">Automático</SelectItem>
                    <SelectItem value="CVT">CVT</SelectItem>
                    <SelectItem value="Automatizado">Automatizado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
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
                <FormMessage />
              </FormItem>
            )}
          />

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
                <FormMessage />
              </FormItem>
            )}
          />

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
                  <SelectContent>
                    <SelectItem value="Sedan">Sedan</SelectItem>
                    <SelectItem value="Hatch">Hatch</SelectItem>
                    <SelectItem value="SUV">SUV</SelectItem>
                    <SelectItem value="Picape">Picape</SelectItem>
                    <SelectItem value="Coupe">Coupe</SelectItem>
                    <SelectItem value="Conversível">Conversível</SelectItem>
                    <SelectItem value="Van">Van</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
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
                <FormMessage />
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
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}

function MarketplaceTab({ form, loading }: { form: any; loading: boolean }) {
  return (
    <div className="flex flex-col gap-6 p-1">
      {/* Vendedor e Publicação */}
      <div className="group border rounded-2xl p-6 bg-card/50 shadow-sm hover:shadow-md hover:bg-card transition-all space-y-6 border-primary/5">
        <div className="flex items-center gap-3 border-b border-primary/10 pb-4">
          <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight">
              Vendedor e Publicação
            </h3>
            <p className="text-xs text-muted-foreground">
              Informações sobre quem está vendendo e detalhes do anúncio
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="seller"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={cn(
                  "text-xs font-bold uppercase tracking-wider text-muted-foreground",
                  form.formState.errors.seller && "text-destructive"
                )}>
                  Vendedor *
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nome do vendedor"
                    {...field}
                    disabled={loading}
                    className={cn(
                      "bg-background/50 rounded-lg h-10",
                      form.formState.errors.seller && "border-destructive ring-1 ring-destructive"
                    )}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="seller_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={cn(
                  "text-xs font-bold uppercase tracking-wider text-muted-foreground",
                  form.formState.errors.seller_type && "text-destructive"
                )}>
                  Tipo de Vendedor *
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value === 'store' ? 'Loja' : field.value === 'dealership' ? 'Concessionária' : 'Particular'}
                  disabled={loading}
                >
                  <FormControl>
                    <SelectTrigger className={cn(
                      "bg-background/50 rounded-lg border-primary/10 hover:border-primary transition-colors h-10",
                      form.formState.errors.seller_type && "border-destructive ring-1 ring-destructive"
                    )}>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent alignItemWithTrigger={false}>
                    <SelectItem value="dealership">Concessionária</SelectItem>
                    <SelectItem value="store">Loja</SelectItem>
                    <SelectItem value="private">Particular</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="col-span-1 md:col-span-2">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2 mb-2 ml-1">
                    <FileText className="h-4 w-4 text-primary" />
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Descrição *
                    </FormLabel>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o veículo com detalhes, opcionais e estado de conservação..."
                      className="min-h-[150px] bg-background/50 rounded-xl border-primary/5 hover:border-primary/20 focus:border-primary transition-all p-4 resize-none"
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>

      {/* Destaques e IA */}
      <div className="relative group overflow-hidden border rounded-3xl p-8 bg-linear-to-br from-primary/5 via-card to-background shadow-lg space-y-6 border-primary/20">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Sparkles className="h-24 w-24 text-primary" />
        </div>

        <div className="flex items-center gap-3 border-b border-primary/10 pb-4 relative z-10">
          <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Destaques e Inteligência Artificial
            </h3>
            <p className="text-xs text-muted-foreground">
              Recursos premium para turbinar seu anúncio
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          <FormField
            control={form.control}
            name="is_new"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-2xl border bg-background/40 backdrop-blur-sm p-4 hover:border-primary/30 transition-colors">
                <div className="space-y-0.5">
                  <FormLabel className="text-sm font-bold">
                    Veículo Novo
                  </FormLabel>
                  <FormDescription className="text-xs">
                    Zero quilômetro
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={loading}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="featured"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-2xl border bg-background/40 backdrop-blur-sm p-4 hover:border-primary/30 transition-colors">
                <div className="space-y-0.5">
                  <FormLabel className="text-sm font-bold">Destaque</FormLabel>
                  <FormDescription className="text-xs">
                    Exibir em áreas nobres
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={loading}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="enable_ai_description"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-2xl border bg-primary/5 p-4 border-primary/20 shadow-inner">
                <div className="space-y-0.5">
                  <FormLabel className="text-sm font-bold text-primary flex items-center gap-2">
                    IA Description
                    <Sparkles className="h-3 w-3" />
                  </FormLabel>
                  <FormDescription className="text-xs">
                    Gerar automaticamente
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={loading}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="col-span-1 md:col-span-3">
            <FormField
              control={form.control}
              name="ai_description"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2 mb-2 ml-1">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Descrição IA (Apenas Leitura)
                    </FormLabel>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="A descrição profissional será gerada automaticamente com base nos dados técnicos informados na aba Geral."
                      className="min-h-[120px] bg-muted/20 backdrop-blur-sm rounded-xl border-dashed border-2 p-4 text-muted-foreground italic text-sm cursor-not-allowed"
                      {...field}
                      value={field.value || ""}
                      disabled
                    />
                  </FormControl>
                  <FormMessage />
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
}: {
  image: any;
  index?: number;
  mainImageUrl: string;
  onDelete?: (id: string) => void;
  onSetMain?: (url: string) => void;
  deletingId?: string | null;
  isPlaceholder?: boolean;
  isOverlay?: boolean;
}) {
  const status = image.status || "success";
  const progress = image.progress || 0;
  const isLocal = image.isLocal;

  return (
    <div
      className={cn(
        "relative group aspect-square rounded-2xl overflow-hidden border bg-muted/30 transition-all duration-300",
        isOverlay
          ? "shadow-2xl scale-105 z-50 cursor-grabbing border-primary/50"
          : "hover:border-primary/30",
        isPlaceholder && "opacity-0",
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
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-between p-3 z-30">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg bg-white/10 hover:bg-destructive hover:text-white transition-colors text-white/90 border border-white/10 backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(image.id);
            }}
            disabled={!!deletingId}
          >
            {deletingId === image.id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </Button>

          {mainImageUrl !== image.url && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-3 rounded-lg bg-white/10 hover:bg-primary hover:text-primary-foreground transition-colors text-white/90 border border-white/10 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wide"
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
        <div className="absolute top-2 right-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
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
}: {
  image: any;
  index: number;
  mainImageUrl: string;
  onDelete: (id: string) => void;
  onSetMain: (url: string) => void;
  deletingId: string | null;
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
      />
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
            upsert: true,
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
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
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
        <div className="mt-4 p-6 rounded-2xl bg-linear-to-br from-primary/5 to-transparent border border-primary/10 flex items-start gap-4">
          <div className="p-2 rounded-lg bg-background shadow-sm mt-1">
            <Info className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold">Gerenciamento de Imagens</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              As imagens selecionadas localmente podem ser reordenadas antes do envio. Clique em "Realizar Upload" para salvar permanentemente.
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
  );
}
