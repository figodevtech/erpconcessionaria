"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { Vehicle } from "./vehicle-list-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  image: z
    .string()
    .url("URL de imagem inválida")
    .min(1, "Imagem é obrigatória"),
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
                {isEditing ? "Editar Veículo" : "Novo Veículo"}
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
                  <TabsTrigger
                    value="Mídia"
                    className={"px-6 rounded-lg transition-all" + tabTheme}
                  >
                    Mídia
                  </TabsTrigger>
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
            </Tabs>

            <DialogFooter className="shrink-0 px-8 py-4 border-t bg-card/50 backdrop-blur-md mt-auto">
              <div className="flex w-full justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                  className="px-6 rounded-xl hover:bg-muted"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="px-8 rounded-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform"
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
                <FormLabel className="text-sm font-semibold shrink-0">
                  Status *
                </FormLabel>
                <div className="flex-1">
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-background/50 rounded-lg border-primary/10 hover:border-primary transition-colors h-9">
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
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Marca *
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Toyota"
                    {...field}
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
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Modelo *
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Corolla"
                    {...field}
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
            name="version"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Versão *
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: XEI 2.0"
                    {...field}
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
            name="plate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Placa *
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: ABC1234"
                    {...field}
                    className="uppercase bg-background/50 rounded-lg h-10"
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
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Ano Fabr. *
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
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
            name="year_model"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Ano Modelo *
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    disabled={loading}
                    className="bg-background/50 rounded-lg h-10"
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
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-primary">
                  Preço (R$) *
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    disabled={loading}
                    className="bg-primary/5 border-primary/20 rounded-lg h-10 font-semibold"
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
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Combustível *
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={loading}
                >
                  <FormControl>
                    <SelectTrigger className="bg-background/50 rounded-lg border-primary/10 hover:border-primary transition-colors h-10">
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
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Transmissão *
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={loading}
                >
                  <FormControl>
                    <SelectTrigger className="bg-background/50 rounded-lg border-primary/10 hover:border-primary transition-colors h-10">
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
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Cor *
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Branco"
                    {...field}
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
            name="doors"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Portas *
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
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
            name="body_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Carroceria *
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={loading}
                >
                  <FormControl>
                    <SelectTrigger className="bg-background/50 rounded-lg border-primary/10 hover:border-primary transition-colors h-10">
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
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Cidade *
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: São Paulo"
                    {...field}
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
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Estado (UF) *
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: SP"
                    maxLength={2}
                    {...field}
                    className="uppercase bg-background/50 rounded-lg h-10"
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
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Vendedor *
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nome do vendedor"
                    {...field}
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
            name="seller_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Tipo de Vendedor *
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={loading}
                >
                  <FormControl>
                    <SelectTrigger className="bg-background/50 rounded-lg border-primary/10 hover:border-primary transition-colors h-10">
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
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative aspect-square rounded-2xl overflow-hidden border border-primary/5 bg-muted shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-grab active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <div className="absolute top-2 left-3 z-20 flex items-center justify-center h-6 min-w-6 px-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-bold text-white shadow-lg pointer-events-none">
        {index + 1}º
      </div>

      <img
        src={image.image_url}
        alt="Vehicle"
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 pointer-events-none"
      />

      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="absolute top-2 right-2 flex flex-col gap-2 z-20">
        <Button
          size="icon"
          className="h-9 w-9 bg-red-500/60 rounded-full shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 border-2 border-white/20 hover:scale-110 active:scale-95"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(image.id);
          }}
          disabled={deletingId === image.id}
          onPointerDown={(e) => e.stopPropagation()}
          title="Excluir imagem"
        >
          {deletingId === image.id ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>

        {image.image_url !== mainImageUrl && (
          <Button
            variant="secondary"
            size="icon"
            className="h-9 w-9 rounded-full shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 delay-75 border-2 border-white/20 hover:bg-primary hover:text-primary-foreground hover:scale-110 active:scale-95"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSetMain(image.image_url);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            title="Definir como principal"
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
      </div>

      {image.image_url === mainImageUrl && (
        <div className="absolute bottom-3 left-3 px-2 py-1 rounded-md bg-primary text-[10px] font-bold text-primary-foreground uppercase tracking-widest shadow-lg">
          Principal
        </div>
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
  onImagesChange: (images: any[]) => void;
  onImageDeleted: (id: string) => void;
  loading: boolean;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const mainImageUrl = form.watch("image");

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over.id);

      onImagesChange(arrayMove(images, oldIndex, newIndex));
    }
  };

  const handleDelete = async (id: string) => {
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
            <h3 className="text-xl font-bold tracking-tight">
              Galeria de Mídia
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Salve o veículo primeiro para começar a gerenciar sua galeria de
              fotos.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-1">
      <div className="flex items-center justify-between border-b border-primary/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary shadow-sm">
            <Camera className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight">
              Galeria de Fotos
            </h3>
            <p className="text-xs text-muted-foreground">
              {images.length}{" "}
              {images.length === 1
                ? "imagem encontrada"
                : "imagens encontradas"}{" "}
              para este veículo
            </p>
          </div>
        </div>
      </div>

      {images.length === 0 ? (
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
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={images.map((img) => img.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {images.map((image, index) => (
                <SortableImage
                  key={image.id}
                  image={image}
                  index={index}
                  mainImageUrl={mainImageUrl}
                  onDelete={(id) => setConfirmDeleteId(id)}
                  onSetMain={(url) => {
                    form.setValue("image", url);
                    toast.success("Foto principal atualizada!");
                  }}
                  deletingId={deletingId}
                />
              ))}
            </div>
          </SortableContext>
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
            As imagens são carregadas automaticamente. Você pode remover imagens
            clicando no ícone de lixeira que aparece ao passar o mouse. A
            ordenação pode ser ajustada futuramente através de arraste-e-solte.
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
              desfeita e a foto será excluída permanentemente da galeria do
              veículo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-xl border-primary/10 hover:bg-muted transition-colors">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground transition-colors shadow-lg shadow-destructive/20"
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
            >
              Excluir Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
