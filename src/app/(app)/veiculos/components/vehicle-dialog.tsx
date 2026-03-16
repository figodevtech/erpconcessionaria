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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Vehicle } from "./vehicle-list-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
      <DialogContent
        className={`
        h-svh w-[100dvw] max-w-[100dvw] p-0 overflow-hidden min-w-0
        sm:max-w-[1100px] sm:max-h-[850px] sm:w-[95vw] sm:min-w-0
      `}
      >
        {fetching && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all animate-in fade-in duration-200">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm font-medium animate-pulse">
                Carregando dados atualizados...
              </p>
            </div>
          </div>
        )}

        <div className="flex h-full min-h-0 flex-col">
          <DialogHeader className="shrink-0 px-6 py-4 border-b">
            <DialogTitle className="flex flex-row items-center gap-5">
              {isEditing ? "Editar Veículo" : "Novo Veículo"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Atualize as informações do veículo conforme necessário."
                : "Preencha os dados abaixo para cadastrar um novo veículo."}
            </DialogDescription>
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
                <TabsList className="shrink-0 top-0 z-10 bg-background mt-3 ml-3">
                  <TabsTrigger
                    value="Geral"
                    className={"hover:cursor-pointer" + tabTheme}
                  >
                    Geral
                  </TabsTrigger>
                  <TabsTrigger
                    value="Marketplace"
                    className={"hover:cursor-pointer" + tabTheme}
                  >
                    Marketplace
                  </TabsTrigger>
                  <TabsTrigger
                    value="Mídia"
                    className={"hover:cursor-pointer" + tabTheme}
                  >
                    Mídia
                  </TabsTrigger>
                </TabsList>

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
                    <MediaTab form={form} loading={loading} />
                  </ScrollArea>
                </TabsContent>
              </Tabs>

              <DialogFooter className="shrink-0 px-6 py-4 border-t">
                <div className="flex w-full justify-end gap-3 pb-4 px-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={loading}
                    className="hover:cursor-pointer"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="hover:cursor-pointer"
                  >
                    {loading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Salvar
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GeneralTab({ form, loading }: { form: any; loading: boolean }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-1">
      <div className="flex flex-row w-full items-center justify-between space-y-4 md:col-span-3 border-b">
        <h3 className="text-lg font-medium pb-2">Informações Básicas</h3>
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2">
              <FormLabel>Status *</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={loading}
              >
                <FormControl>
                  <SelectTrigger>
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
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="brand"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Marca *</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Toyota" {...field} disabled={loading} />
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
            <FormLabel>Modelo *</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Corolla" {...field} disabled={loading} />
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
            <FormLabel>Versão *</FormLabel>
            <FormControl>
              <Input placeholder="Ex: XEI 2.0" {...field} disabled={loading} />
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
            <FormLabel>Placa *</FormLabel>
            <FormControl>
              <Input
                placeholder="Ex: ABC1234"
                {...field}
                className="uppercase"
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
            <FormLabel>Ano Fabricação *</FormLabel>
            <FormControl>
              <Input type="number" {...field} disabled={loading} />
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
            <FormLabel>Ano Modelo *</FormLabel>
            <FormControl>
              <Input type="number" {...field} disabled={loading} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-4 md:col-span-3 pt-4">
        <h3 className="text-lg font-medium border-b pb-2">
          Valores e Especificações
        </h3>
      </div>

      <FormField
        control={form.control}
        name="price"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Preço (R$) *</FormLabel>
            <FormControl>
              <Input type="number" step="0.01" {...field} disabled={loading} />
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
            <FormLabel>FIPE (R$)</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.01"
                {...field}
                value={field.value || ""}
                disabled={loading}
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
            <FormLabel>Quilometragem</FormLabel>
            <FormControl>
              <Input
                type="number"
                {...field}
                value={field.value || ""}
                disabled={loading}
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
            <FormLabel>Motorização</FormLabel>
            <FormControl>
              <Input
                placeholder="Ex: 2.0"
                {...field}
                value={field.value || ""}
                disabled={loading}
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
            <FormLabel>Potência (cv)</FormLabel>
            <FormControl>
              <Input
                type="number"
                {...field}
                value={field.value || ""}
                disabled={loading}
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
            <FormLabel>Combustível *</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={loading}
            >
              <FormControl>
                <SelectTrigger>
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
            <FormLabel>Transmissão *</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={loading}
            >
              <FormControl>
                <SelectTrigger>
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
            <FormLabel>Cor *</FormLabel>
            <FormControl>
              <Input placeholder="Ex: Branco" {...field} disabled={loading} />
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
            <FormLabel>Portas *</FormLabel>
            <FormControl>
              <Input type="number" {...field} disabled={loading} />
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
            <FormLabel>Tipo *</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={loading}
            >
              <FormControl>
                <SelectTrigger>
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

      <div className="space-y-4 md:col-span-3 pt-4">
        <h3 className="text-lg font-medium border-b pb-2">Localização</h3>
      </div>

      <FormField
        control={form.control}
        name="city"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cidade *</FormLabel>
            <FormControl>
              <Input
                placeholder="Ex: São Paulo"
                {...field}
                disabled={loading}
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
            <FormLabel>Estado (UF) *</FormLabel>
            <FormControl>
              <Input
                placeholder="Ex: SP"
                maxLength={2}
                {...field}
                className="uppercase"
                disabled={loading}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function MarketplaceTab({ form, loading }: { form: any; loading: boolean }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
      <div className="space-y-4 md:col-span-2">
        <h3 className="text-lg font-medium border-b pb-2">
          Vendedor e Publicação
        </h3>
      </div>

      <FormField
        control={form.control}
        name="seller"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Vendedor *</FormLabel>
            <FormControl>
              <Input
                placeholder="Nome do vendedor"
                {...field}
                disabled={loading}
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
            <FormLabel>Tipo de Vendedor *</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={loading}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="dealership">Concessionária</SelectItem>
                <SelectItem value="store">Loja</SelectItem>
                <SelectItem value="private">Particular</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="col-span-2">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva o veículo..."
                  className="min-h-[150px]"
                  {...field}
                  disabled={loading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-4 md:col-span-2 pt-4">
        <h3 className="text-lg font-medium border-b pb-2">Destaques e IA</h3>
      </div>

      <div className="grid grid-cols-3 col-span-2 gap-6 p-1">
        <FormField
          control={form.control}
          name="is_new"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Veículo Novo</FormLabel>
                <FormDescription>Zero quilômetro</FormDescription>
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
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Destaque</FormLabel>
                <FormDescription>Exibir em áreas de destaque</FormDescription>
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
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">IA Description</FormLabel>
                <FormDescription>Habilitar descrição via IA</FormDescription>
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
        <div className="col-span-3">
          <FormField
            control={form.control}
            name="ai_description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição IA (Opcional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descrição gerada por IA..."
                    className="min-h-[150px]"
                    {...field}
                    value={field.value || ""}
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

function MediaTab({ form, loading }: { form: any; loading: boolean }) {
  return (
    <div className="flex flex-col gap-6 p-1">
      <div className="space-y-4">
        <h3 className="text-lg font-medium border-b pb-2">Mídia e Descrição</h3>

        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link da Imagem Principal *</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://..."
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
  );
}
