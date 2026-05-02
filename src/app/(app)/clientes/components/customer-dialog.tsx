"use client";

import { useEffect, useTransition } from "react";
import type React from "react";
import { useForm, useWatch, type Control } from "react-hook-form";
import {
  Building2,
  FileText,
  IdCard,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { createCustomerAction, updateCustomerAction } from "@/actions/customers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  formatCpfCnpj,
  formatPhone,
  formatZipCode,
  onlyDigits,
  type Customer,
  type CustomerFormValues,
  type CustomerPersonType,
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
};

type ViaCepResponse = {
  erro?: boolean;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  complemento?: string;
  ibge?: string;
};

export function CustomerDialog({
  open,
  onOpenChange,
  customer,
  onSuccess,
}: CustomerDialogProps) {
  const { hasPermission } = usePermissions();
  const [isPending, startTransition] = useTransition();
  const [isLookingUpZip, startZipLookup] = useTransition();
  const [isLookingUpCnpj, startCnpjLookup] = useTransition();
  const isEditing = !!customer;
  const canSave = hasPermission(isEditing ? "customers:update" : "customers:create");

  const form = useForm<CustomerFormValues>({ defaultValues });
  const personType = useWatch({ control: form.control, name: "person_type" });
  const status = useWatch({ control: form.control, name: "status" });
  const watchedName = useWatch({ control: form.control, name: "name" });
  const watchedDocument = useWatch({ control: form.control, name: "cpf_cnpj" });
  const watchedCity = useWatch({ control: form.control, name: "city" });
  const watchedState = useWatch({ control: form.control, name: "state" });

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
      });
    } else {
      form.reset(defaultValues);
    }
  }, [customer, form, open]);

  function lookupZipCode() {
    const zipCode = onlyDigits(form.getValues("zip_code") || "");
    if (zipCode.length !== 8) {
      toast.error("Informe um CEP com 8 dígitos.");
      return;
    }

    startZipLookup(async () => {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${zipCode}/json/`);
        const data = (await response.json()) as ViaCepResponse;

        if (!response.ok || data.erro) {
          toast.error("CEP não encontrado.");
          return;
        }

        form.setValue("address", data.logradouro || "");
        form.setValue("neighborhood", data.bairro || "");
        form.setValue("city", data.localidade || "");
        form.setValue("state", data.uf || "");
        form.setValue("address_complement", data.complemento || form.getValues("address_complement") || "");
        form.setValue("city_code", data.ibge || "");
      } catch {
        toast.error("Não foi possível consultar o CEP.");
      }
    });
  }

  function lookupCnpj() {
    const cnpj = onlyDigits(form.getValues("cpf_cnpj") || "");
    if (cnpj.length !== 14) {
      toast.error("Informe um CNPJ válido com 14 dígitos.");
      return;
    }

    startCnpjLookup(async () => {
      try {
        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
        const data = await response.json();

        if (!response.ok) {
          toast.error("CNPJ não encontrado ou erro na consulta.");
          return;
        }

        form.setValue("name", data.razao_social || "");
        form.setValue("email", data.email || "");
        form.setValue("phone", data.ddd_telefone_1 || "");
        form.setValue("zip_code", data.cep || "");
        form.setValue("address", data.logradouro || "");
        form.setValue("address_number", data.numero || "");
        form.setValue("address_complement", data.complemento || "");
        form.setValue("neighborhood", data.bairro || "");
        form.setValue("city", data.municipio || "");
        form.setValue("state", data.uf || "");
        
        toast.success("Dados do CNPJ carregados com sucesso.");
      } catch {
        toast.error("Não foi possível consultar o CNPJ.");
      }
    });
  }

  function onSubmit(values: CustomerFormValues) {
    startTransition(async () => {
      const result =
        isEditing && customer
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

  const documentLabel = personType === "PF" ? "CPF" : "CNPJ";
  const nameLabel = personType === "PF" ? "Nome completo" : "Razão social";
  const summaryName =
    watchedName?.trim() || (isEditing ? `Cliente #${customer?.id}` : "Novo cliente");
  const summaryLocation = [watchedCity, watchedState].filter(Boolean).join(" / ");
  const isActive = status === "ATIVO";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-svh w-[100dvw] max-w-[100dvw] flex-col overflow-hidden border-0 bg-[#0d0d0f] p-0 text-zinc-100 shadow-[0_0_60px_rgba(0,0,0,0.8)] sm:h-[min(90vh,860px)] sm:w-[95vw] sm:max-w-[1100px] sm:rounded-2xl">

        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <div className="relative shrink-0 overflow-hidden border-b border-white/5 bg-[#111113]">
          {/* accent top stripe */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-white/8" />

          <div className="flex items-start justify-between px-6 pb-5 pt-6 sm:px-8">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/6 ring-1 ring-white/10">
                {personType === "PF" ? (
                  <UserRound className="h-6 w-6 text-zinc-300" />
                ) : (
                  <Building2 className="h-6 w-6 text-zinc-300" />
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="text-lg font-bold tracking-tight text-zinc-50">
                    {summaryName}
                  </DialogTitle>
                  {/* Status badge */}
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/6 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 ring-1 ring-white/10">
                    <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-green-300" : "bg-red-300"}`} />
                    {isActive ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <DialogDescription className="mt-0.5 text-sm text-zinc-500">
                  {watchedDocument
                    ? formatCpfCnpj(watchedDocument)
                    : "Documento pendente"}
                  {summaryLocation ? ` · ${summaryLocation}` : ""}
                  {" · "}
                  {isEditing ? `Edição · #${customer?.id}` : "Novo cadastro"}
                </DialogDescription>
              </div>
            </div>

            {/* Close button */}
            {/* <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button> */}
          </div>
        </div>

        {/* ── FORM BODY ───────────────────────────────────────────────── */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <ScrollArea className="min-h-0 flex-1">
              <div className="space-y-5 p-6 sm:p-8">

                {/* ── SECTION: Identificação ──────────────────────────── */}
                <FormSection
                  icon={<IdCard className="h-4 w-4 text-zinc-500" />}
                  label="Identificação"
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[0.6fr_1fr_0.6fr_0.8fr]">
                    {/* Tipo de pessoa */}
                    <FormField
                      control={form.control}
                      name="person_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                            Tipo de pessoa *
                          </FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={(value) => {
                              const newType = value as CustomerPersonType;
                              field.onChange(newType);
                              
                              // Esvazia todos os campos ao mudar o tipo (mantendo apenas o tipo e o status atual)
                              const currentStatus = form.getValues("status");
                              form.reset({
                                ...defaultValues,
                                person_type: newType,
                                status: currentStatus,
                              });
                            }}
                            disabled={isPending || !canSave}
                          >
                            <FormControl>
                              <SelectTrigger className="h-10 border-white/8 bg-white/4 text-zinc-100 focus:ring-amber-500/40 focus:border-amber-500/50 hover:bg-white/6 transition-colors">
                                <span>
                                  {personType === "PF" ? "Pessoa física" : "Pessoa jurídica"}
                                </span>
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

                    {/* Documento */}
                    <MaskedInput
                      control={form.control}
                      name="cpf_cnpj"
                      label={`${documentLabel} *`}
                      icon={IdCard}
                      placeholder={personType === "PF" ? "000.000.000-00" : "00.000.000/0000-00"}
                      disabled={isPending || !canSave}
                      required
                      valueFormatter={formatCpfCnpj}
                      valueParser={(value) =>
                        onlyDigits(value).slice(0, personType === "PF" ? 11 : 14)
                      }
                      onLookup={personType === "PJ" ? lookupCnpj : undefined}
                      isLookingUp={isLookingUpCnpj}
                    />

                    {/* Status */}
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                            Status
                          </FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={(value) =>
                              field.onChange(value as CustomerStatus)
                            }
                            disabled={isPending || !canSave}
                          >
                            <FormControl>
                              <SelectTrigger className="h-10 border-white/8 bg-white/4 text-zinc-100 focus:ring-amber-500/40 focus:border-amber-500/50 hover:bg-white/6 transition-colors">
                                <span>{isActive ? "Ativo" : "Inativo"}</span>
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

                    {/* Nome / Razão social */}
                    <TextInput
                    className="col-span-full"
                      control={form.control}
                      name="name"
                      label={`${nameLabel} *`}
                      icon={UserRound}
                      placeholder={nameLabel}
                      disabled={isPending || !canSave}
                      required
                    />
                  </div>
                </FormSection>

                {/* ── SECTION: Contato ────────────────────────────────── */}
                <FormSection
                  icon={<Phone className="h-4 w-4 text-zinc-500" />}
                  label="Contato"
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <TextInput
                      control={form.control}
                      name="email"
                      label="Email *"
                      icon={Mail}
                      placeholder="cliente@exemplo.com"
                      disabled={isPending || !canSave}
                      required
                      type="email"
                    />
                    <MaskedInput
                      control={form.control}
                      name="phone"
                      label="Telefone *"
                      icon={Phone}
                      placeholder="(83) 99999-9999"
                      disabled={isPending || !canSave}
                      required
                      valueFormatter={formatPhone}
                      valueParser={(value) => onlyDigits(value).slice(0, 11)}
                    />
                  </div>
                </FormSection>

                {/* ── SECTION: Endereço ───────────────────────────────── */}
                <FormSection
                  icon={<MapPin className="h-4 w-4 text-zinc-500" />}
                  label="Endereço"
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* CEP com busca */}
                    <FormField
                      control={form.control}
                      name="zip_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                            CEP
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                className="h-10 border-white/8 bg-white/4 pr-10 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-white/20 focus-visible:ring-white/10 transition-colors"
                                placeholder="00000-000"
                                value={formatZipCode(field.value || "")}
                                onChange={(e) =>
                                  field.onChange(
                                    onlyDigits(e.target.value).slice(0, 8)
                                  )
                                }
                                disabled={isPending || !canSave || isLookingUpZip}
                              />
                              <button
                                type="button"
                                onClick={lookupZipCode}
                                disabled={isPending || !canSave || isLookingUpZip}
                                aria-label="Buscar CEP"
                                className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center rounded-r-md text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200 disabled:opacity-40"
                              >
                                {isLookingUpZip ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Search className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <TextInput
                      control={form.control}
                      name="address"
                      label="Logradouro"
                      icon={MapPin}
                      disabled={isPending || !canSave}
                      className="lg:col-span-2"
                    />
                    <TextInput
                      control={form.control}
                      name="address_number"
                      label="Número"
                      disabled={isPending || !canSave}
                    />
                    <TextInput
                      control={form.control}
                      name="neighborhood"
                      label="Bairro"
                      disabled={isPending || !canSave}
                    />
                    <TextInput
                      control={form.control}
                      name="city"
                      label="Cidade *"
                      disabled={isPending || !canSave}
                      required
                    />
                    <TextInput
                      control={form.control}
                      name="state"
                      label="Estado *"
                      disabled={isPending || !canSave}
                      required
                      maxLength={2}
                      uppercase
                    />
                    <TextInput
                      control={form.control}
                      name="address_complement"
                      label="Complemento"
                      disabled={isPending || !canSave}
                    />
                  </div>
                </FormSection>

                {/* ── SECTION: Dados fiscais — só para PJ ─────────────── */}
                {personType === "PJ" && (
                  <FormSection
                    icon={<FileText className="h-4 w-4 text-zinc-500" />}
                    label="Dados fiscais"
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <TextInput
                        control={form.control}
                        name="state_registration"
                        label="Inscrição estadual"
                        disabled={isPending || !canSave}
                      />
                      <TextInput
                        control={form.control}
                        name="municipal_registration"
                        label="Inscrição municipal"
                        disabled={isPending || !canSave}
                      />
                      <TextInput
                        control={form.control}
                        name="city_code"
                        label="Código do município"
                        disabled={isPending || !canSave}
                      />
                    </div>
                  </FormSection>
                )}
              </div>
            </ScrollArea>

            {/* ── FOOTER ────────────────────────────────────────────── */}
            <div className="shrink-0 border-t border-white/5 bg-[#111113] px-6 py-4 sm:px-8">
              <div className="flex w-full items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-10 px-5 text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending}
                >
                  Cancelar
                </Button>
                {canSave && (
                  <Button
                    type="submit"
                    disabled={isPending}
                    className=" h-10 bg-blue-800 px-7 font-semibold shadow-lg shadow-blue-500/20 transition-all hover:cursor-pointer hover:shadow-blue-500/25 active:scale-[0.98] disabled:opacity-60"
                  >
                    {isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {isEditing ? "Salvar alterações" : "Cadastrar cliente"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/* ─── FormSection ──────────────────────────────────────────────────────── */

const sectionClass = "border-white/6 bg-white/[0.02]";

function FormSection({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border ${sectionClass} p-5`}>
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

/* ─── TextInput ────────────────────────────────────────────────────────── */

function TextInput({
  control,
  name,
  label,
  disabled,
  required,
  maxLength,
  uppercase,
  icon: Icon,
  placeholder,
  type = "text",
  className,
}: {
  control: Control<CustomerFormValues>;
  name: keyof CustomerFormValues;
  label: string;
  disabled: boolean;
  required?: boolean;
  maxLength?: number;
  uppercase?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            {label}
          </FormLabel>
          <FormControl>
            <div className="relative">
              {Icon && (
                <Icon className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              )}
              <Input
                type={type}
                value={(field.value as string) || ""}
                onChange={(e) =>
                  field.onChange(
                    uppercase ? e.target.value.toUpperCase() : e.target.value
                  )
                }
                disabled={disabled}
                required={required}
                maxLength={maxLength}
                placeholder={placeholder}
                className={`h-10 border-white/8 bg-white/4 text-zinc-100 placeholder:text-zinc-600 transition-colors focus-visible:border-white/20 focus-visible:ring-white/10 hover:bg-white/6 ${Icon ? "pl-9" : ""} ${uppercase ? "uppercase" : ""}`}
              />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/* ─── MaskedInput ──────────────────────────────────────────────────────── */

function MaskedInput({
  control,
  name,
  label,
  disabled,
  required,
  icon: Icon,
  placeholder,
  valueFormatter,
  valueParser,
  onLookup,
  isLookingUp,
}: {
  control: Control<CustomerFormValues>;
  name: keyof CustomerFormValues;
  label: string;
  disabled: boolean;
  required?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  placeholder?: string;
  valueFormatter: (value: string) => string;
  valueParser: (value: string) => string;
  onLookup?: () => void;
  isLookingUp?: boolean;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            {label}
          </FormLabel>
          <FormControl>
            <div className="relative">
              <Icon className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                className={`h-10 border-white/8 bg-white/4 pl-9 text-zinc-100 placeholder:text-zinc-600 transition-colors focus-visible:border-white/20 focus-visible:ring-white/10 hover:bg-white/6 ${onLookup ? "pr-10" : ""}`}
                placeholder={placeholder}
                value={valueFormatter((field.value as string) || "")}
                onChange={(e) => field.onChange(valueParser(e.target.value))}
                disabled={disabled || isLookingUp}
                required={required}
              />
              {onLookup && (
                <button
                  type="button"
                  onClick={onLookup}
                  disabled={disabled || isLookingUp}
                  className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center rounded-r-md text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200 disabled:opacity-40"
                >
                  {isLookingUp ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
