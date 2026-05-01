"use client";

import { useEffect, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Building2, CheckCircle2, IdCard, Loader2, Mail, MapPin, Phone, Star, UserRound } from "lucide-react";
import { toast } from "sonner";
import { createCustomerAction, updateCustomerAction } from "@/actions/customers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  CUSTOMER_RANKS,
  customerRankLabel,
  formatCpfCnpj,
  formatPhone,
  formatZipCode,
  onlyDigits,
  type Customer,
  type CustomerFormValues,
  type CustomerPersonType,
  type CustomerRank,
  type CustomerStatus,
} from "@/lib/customers";
import { usePermissions } from "@/hooks/use-permissions";

type CustomerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  onSuccess: () => void;
};

const defaultValues: CustomerFormValues = {
  person_type: "PF",
  cpf_cnpj: "",
  name: "",
  email: "",
  phone: "",
  address: "",
  address_number: "",
  address_complement: "",
  neighborhood: "",
  city: "",
  state: "",
  zip_code: "",
  state_registration: "",
  municipal_registration: "",
  city_code: "",
  status: "ATIVO",
  rank: "",
};

export function CustomerDialog({
  open,
  onOpenChange,
  customer,
  onSuccess,
}: CustomerDialogProps) {
  const { hasPermission } = usePermissions();
  const [isPending, startTransition] = useTransition();
  const isEditing = !!customer;
  const canSave = hasPermission(isEditing ? "customers:update" : "customers:create");

  const form = useForm<CustomerFormValues>({ defaultValues });
  const personType = useWatch({ control: form.control, name: "person_type" });
  const status = useWatch({ control: form.control, name: "status" });
  const rank = useWatch({ control: form.control, name: "rank" });

  useEffect(() => {
    if (!open) return;
    if (customer) {
      form.reset({
        person_type: customer.person_type,
        cpf_cnpj: customer.cpf_cnpj,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address || "",
        address_number: customer.address_number || "",
        address_complement: customer.address_complement || "",
        neighborhood: customer.neighborhood || "",
        city: customer.city,
        state: customer.state,
        zip_code: customer.zip_code || "",
        state_registration: customer.state_registration || "",
        municipal_registration: customer.municipal_registration || "",
        city_code: customer.city_code || "",
        status: customer.status,
        rank: customer.rank || "",
      });
    } else {
      form.reset(defaultValues);
    }
  }, [customer, form, open]);

  function onSubmit(values: CustomerFormValues) {
    startTransition(async () => {
      const result = isEditing && customer
        ? await updateCustomerAction(customer.id, values)
        : await createCustomerAction(values);

      if (result.success) {
        toast.success(isEditing ? "Cliente atualizado" : "Cliente cadastrado");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.error ?? "Erro ao salvar cliente");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-svh w-[100dvw] max-w-[100dvw] flex-col overflow-hidden border-none p-0 shadow-2xl sm:max-h-[min(90vh,850px)] sm:w-[95vw] sm:max-w-[1100px]">
        <DialogHeader className="shrink-0 border-b bg-card/50 px-8 py-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <UserRound className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold tracking-tight">
                {isEditing ? "Editar cliente" : "Novo cliente"}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-muted-foreground">
                {isEditing
                  ? "Atualize os dados cadastrais, fiscais e de contato do cliente."
                  : "Cadastre um cliente para vincular vendas, documentos e operações futuras."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <ScrollArea className="flex-1 bg-muted-foreground/5">
              <div className="grid grid-cols-1 gap-6 p-8 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="person_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de pessoa*</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value as CustomerPersonType);
                          form.setValue("cpf_cnpj", "");
                        }}
                        disabled={isPending || !canSave}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>{personType === "PF" ? "Pessoa física" : "Pessoa jurídica"}</span>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent alignItemWithTrigger={false}>
                          <SelectItem value="PF">Pessoa física</SelectItem>
                          <SelectItem value="PJ">Pessoa jurídica</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cpf_cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{personType === "PF" ? "CPF*" : "CNPJ*"}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <IdCard className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            className="pl-9"
                            placeholder={personType === "PF" ? "000.000.000-00" : "00.000.000/0000-00"}
                            value={formatCpfCnpj(field.value)}
                            onChange={(event) => field.onChange(onlyDigits(event.target.value).slice(0, personType === "PF" ? 11 : 14))}
                            disabled={isPending || !canSave}
                            required
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select value={field.value} onValueChange={(value) => field.onChange(value as CustomerStatus)} disabled={isPending || !canSave}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <span>{status === "ATIVO" ? "Ativo" : "Inativo"}</span>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent alignItemWithTrigger={false}>
                          <SelectItem value="ATIVO">Ativo</SelectItem>
                          <SelectItem value="INATIVO">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>{personType === "PF" ? "Nome completo*" : "Razão social*"}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <UserRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-9" placeholder="Nome ou razão social" {...field} disabled={isPending || !canSave} required />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rank"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Classificação</FormLabel>
                      <Select value={field.value || "none"} onValueChange={(value) => field.onChange(value === "none" ? "" : value as CustomerRank)} disabled={isPending || !canSave}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <Star className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>{customerRankLabel(rank || null)}</span>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent alignItemWithTrigger={false}>
                          <SelectItem value="none">Sem classificação</SelectItem>
                          {CUSTOMER_RANKS.map((item) => (
                            <SelectItem key={item} value={item}>{customerRankLabel(item)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail*</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input type="email" className="pl-9" placeholder="cliente@exemplo.com" {...field} disabled={isPending || !canSave} required />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone*</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            className="pl-9"
                            placeholder="(83) 99999-9999"
                            value={formatPhone(field.value)}
                            onChange={(event) => field.onChange(onlyDigits(event.target.value).slice(0, 11))}
                            disabled={isPending || !canSave}
                            required
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="zip_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="00000-000"
                          value={formatZipCode(field.value || "")}
                          onChange={(event) => field.onChange(onlyDigits(event.target.value).slice(0, 8))}
                          disabled={isPending || !canSave}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-9" placeholder="Rua, avenida ou logradouro" {...field} disabled={isPending || !canSave} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <TextInput control={form.control} name="address_number" label="Número" disabled={isPending || !canSave} />
                <TextInput control={form.control} name="address_complement" label="Complemento" disabled={isPending || !canSave} />
                <TextInput control={form.control} name="neighborhood" label="Bairro" disabled={isPending || !canSave} />
                <TextInput control={form.control} name="city" label="Cidade*" disabled={isPending || !canSave} required />
                <TextInput control={form.control} name="state" label="UF*" disabled={isPending || !canSave} required maxLength={2} uppercase />
                <TextInput control={form.control} name="city_code" label="Código do município" disabled={isPending || !canSave} />
                <TextInput control={form.control} name="state_registration" label="Inscrição estadual" disabled={isPending || !canSave} />
                <TextInput control={form.control} name="municipal_registration" label="Inscrição municipal" disabled={isPending || !canSave} />
              </div>
            </ScrollArea>

            <DialogFooter className="shrink-0 border-t bg-card/50 px-8 py-4 backdrop-blur-md">
              <div className="flex w-full justify-end gap-3 pb-4 pr-4">
                <Button type="button" variant="outline" className="rounded-xl px-6" onClick={() => onOpenChange(false)} disabled={isPending}>
                  Cancelar
                </Button>
                {canSave && (
                  <Button type="submit" className="rounded-xl px-8 shadow-lg shadow-primary/20" disabled={isPending}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Salvar cliente
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

function TextInput({
  control,
  name,
  label,
  disabled,
  required,
  maxLength,
  uppercase,
}: {
  control: ReturnType<typeof useForm<CustomerFormValues>>["control"];
  name: keyof CustomerFormValues;
  label: string;
  disabled: boolean;
  required?: boolean;
  maxLength?: number;
  uppercase?: boolean;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              value={(field.value as string) || ""}
              onChange={(event) => field.onChange(uppercase ? event.target.value.toUpperCase() : event.target.value)}
              disabled={disabled}
              required={required}
              maxLength={maxLength}
              className={uppercase ? "uppercase" : undefined}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
