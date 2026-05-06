"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  CalendarClock,
  CreditCard,
  FileText,
  Loader2,
  Paperclip,
  Plus,
  ReceiptText,
  Search,
  UserRound,
  WalletCards,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { listCustomersAction } from "@/actions/customers";
import { createTransactionAction } from "@/actions/transactions";
import { getTypeCatalogAction } from "@/actions/type-catalog";
import { Button } from "@/components/ui/button";
import { CustomerDialog } from "@/app/(app)/clientes/components/customer-dialog";
import { CustomerSelectorDialog } from "@/app/(app)/clientes/components/customer-selector-dialog";
import {
  TypeCreateDialog,
  type TypeDialogMode,
} from "@/app/(app)/tipos/components/type-create-dialog";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatFileSize } from "@/lib/documents";
import { formatCpfCnpj, type Customer } from "@/lib/customers";
import {
  type TransactionFormValues,
} from "@/lib/transactions";
import { bankAccountTypeLabel, type BankAccount, type DynamicPaymentMethod, type TransactionCategory } from "@/lib/type-catalog";
import { formatCurrency } from "@/lib/utils";

type VehicleOption = {
  id: string;
  brand: string;
  model: string;
  plate?: string | null;
};

type TransactionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updatedVehicle?: unknown) => void;
  vehicle?: VehicleOption | null;
  saleId?: number | null;
  saleValue?: number | null;
};

function nowForInput() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

export function TransactionDialog({
  open,
  onOpenChange,
  onSuccess,
  vehicle,
  saleId,
  saleValue,
}: TransactionDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<DynamicPaymentMethod[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [quickTypeDialogMode, setQuickTypeDialogMode] = useState<TypeDialogMode>(null);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [customerSelectorOpen, setCustomerSelectorOpen] = useState(false);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<TransactionFormValues>({
    defaultValues: {
      descricao: "",
      valor: saleValue ? formatCurrency(saleValue) : "",
      data: nowForInput(),
      metodo_pagamento: "PIX",
      categoria: "NAO RELACIONADO",
      tipo: "RECEITA",
      vehicle_id: vehicle?.id ?? "",
      venda_id: saleId ? saleId.toString() : "",
      customer_id: "",
      categoria_id: "",
      banco_id: "",
      payment_method_id: "",
      nome_pagador: "",
      cpf_cnpj_pagador: "",
      valor_liquido: "",
      pendente: false,
    },
  });
  const selectedType = useWatch({ control: form.control, name: "tipo" });
  const selectedPaymentId = useWatch({ control: form.control, name: "payment_method_id" });
  const selectedBankId = useWatch({ control: form.control, name: "banco_id" });
  const selectedCategoryId = useWatch({ control: form.control, name: "categoria_id" });
  const selectedCustomerId = useWatch({ control: form.control, name: "customer_id" });
  const isSalePayment = !!saleId;

  useEffect(() => {
    if (!open) return;

    form.reset({
      descricao: "",
      valor: saleValue ? formatCurrency(saleValue) : "",
      data: nowForInput(),
      metodo_pagamento: "PIX",
      categoria: "NAO RELACIONADO",
      tipo: "RECEITA",
      vehicle_id: vehicle?.id ?? "",
      venda_id: saleId ? saleId.toString() : "",
      customer_id: "",
      categoria_id: "",
      banco_id: "",
      payment_method_id: "",
      nome_pagador: "",
      cpf_cnpj_pagador: "",
      valor_liquido: "",
      pendente: false,
    });
    const timeout = setTimeout(() => {
      setAttachment(null);
      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = "";
      }
    }, 0);
    return () => clearTimeout(timeout);
  }, [form, open, vehicle?.id, saleId, saleValue]);

  const fetchOptions = useCallback(async ({ preserveSelection = false } = {}) => {
    try {
      const currentCategoryId = form.getValues("categoria_id");
      const currentBankId = form.getValues("banco_id");
      const currentPaymentMethodId = form.getValues("payment_method_id");

      const [typesResult, customersResult] = await Promise.all([
        getTypeCatalogAction(),
        listCustomersAction({ page: 1, pageSize: 100, status: "ATIVO" }),
      ]);

      if (typesResult.success && typesResult.data) {
        const activeCategories = typesResult.data.categories.filter((item) => item.ativo);
        const activeBanks = typesResult.data.bankAccounts.filter((item) => item.ativo);
        const activePayments = typesResult.data.paymentMethods.filter((item) => item.ativo);

        setCategories(activeCategories);
        setBankAccounts(activeBanks);
        setPaymentMethods(activePayments);

        if (saleId) {
          const saleCategory = activeCategories.find(c => c.nome.toUpperCase().includes("PAGAMENTO DE VENDA") || c.nome.toUpperCase().includes("VENDA"));
          if (saleCategory) {
            form.setValue("categoria_id", saleCategory.id.toString());
            form.setValue("categoria", saleCategory.nome);
          } else {
            form.setValue("categoria", "PAGAMENTO DE VENDA");
          }
        } else {
          const selectedCategory = activeCategories.find((item) => item.id.toString() === currentCategoryId);
          const category = preserveSelection ? selectedCategory : null;
          form.setValue("categoria_id", category?.id.toString() ?? activeCategories[0]?.id.toString() ?? "");
          form.setValue("categoria", category?.nome ?? activeCategories[0]?.nome ?? "NAO RELACIONADO");
        }

        const selectedBank = activeBanks.find((item) => item.id.toString() === currentBankId);
        form.setValue("banco_id", (preserveSelection ? selectedBank?.id.toString() : null) ?? activeBanks[0]?.id.toString() ?? "");

        const selectedPayment = activePayments.find((item) => item.id.toString() === currentPaymentMethodId);
        const payment = (preserveSelection ? selectedPayment : null) ?? activePayments[0];
        form.setValue("payment_method_id", payment?.id.toString() ?? "");
        form.setValue("metodo_pagamento", payment?.codigo ?? "PIX");
      }

      if (customersResult.success && customersResult.data) {
        setCustomers(customersResult.data);
      } else {
        setCustomers([]);
      }
    } catch { }
  }, [form, saleId]);

  const fetchCustomers = useCallback(async ({ selectNewest = false } = {}) => {
    const currentCustomerId = form.getValues("customer_id");
    const result = await listCustomersAction({ page: 1, pageSize: 100, status: "ATIVO" });

    if (!result.success || !result.data) {
      setCustomers([]);
      return;
    }

    setCustomers(result.data);

    const selectedCustomer = selectNewest
      ? result.data[0]
      : result.data.find((item) => item.id.toString() === currentCustomerId);

    if (selectedCustomer) {
      const id = selectedCustomer.id.toString();
      form.setValue("customer_id", id);
      form.setValue("nome_pagador", selectedCustomer.name);
      form.setValue("cpf_cnpj_pagador", formatCpfCnpj(selectedCustomer.cpf_cnpj));
    }
  }, [form]);

  useEffect(() => {
    if (!open) return;
    const timeout = setTimeout(() => {
      fetchOptions();
    }, 0);
    return () => clearTimeout(timeout);
  }, [fetchOptions, open]);

  function onSubmit(values: TransactionFormValues) {
    const formData = new FormData();

    Object.entries(values).forEach(([key, value]) => {
      formData.set(key, value == null ? "" : String(value));
    });

    if (attachment) {
      formData.set("attachment", attachment);
    }

    startTransition(async () => {
      const result = await createTransactionAction(formData);
      if (result.success) {
        toast.success("TransaÃ§Ã£o lanÃ§ada com sucesso");
        onSuccess(result.vehicle);
        onOpenChange(false);
      } else {
        toast.error(result.error ?? "Erro ao criar transaÃ§Ã£o");
      }
    });
  }

  const selectedTypeLabel = selectedType === "DESPESA" ? "Despesa" : "Receita";
  const selectedPayment = paymentMethods.find(
    (item) => item.id.toString() === selectedPaymentId,
  );
  const selectedBank = bankAccounts.find(
    (item) => item.id.toString() === selectedBankId,
  );
  const selectedCategory = categories.find(
    (item) => item.id.toString() === selectedCategoryId,
  );
  const selectedCustomer = customers.find(
    (item) => item.id.toString() === selectedCustomerId,
  );

  function selectCustomer(customer: Customer) {
    const id = customer.id.toString();
    form.setValue("customer_id", id);
    form.setValue("nome_pagador", customer.name);
    form.setValue("cpf_cnpj_pagador", formatCpfCnpj(customer.cpf_cnpj));
    setCustomers((current) => current.some((item) => item.id === customer.id) ? current : [customer, ...current]);
  }
  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-svh w-[100dvw] max-w-[100dvw] flex-col overflow-hidden border-none p-0 shadow-2xl sm:max-h-[min(90vh,850px)] sm:w-[95vw] sm:max-w-[980px]">
        <DialogHeader className="shrink-0 border-b bg-card/50 px-8 py-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <ReceiptText className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold tracking-tight">
                Nova transaÃ§Ã£o
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-muted-foreground">
                Lance uma receita ou despesa vinculada ao caixa, a uma venda ou a um veÃ­culo.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
            <ScrollArea className="flex-1 overflow-y-auto bg-muted-foreground/5">
              <div className="grid grid-cols-1 gap-6 p-8 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange} disabled={isPending || isSalePayment}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <span className="truncate w-full text-left">{selectedTypeLabel || "Selecione"}</span>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent alignItemWithTrigger={false}>
                          <SelectItem value="RECEITA">Receita</SelectItem>
                          {!isSalePayment && <SelectItem value="DESPESA">Despesa</SelectItem>}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payment_method_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MÃ©todo de pagamento</FormLabel>
                      <Select
                        value={field.value || ""}
                        onValueChange={(value) => {
                          field.onChange(value);
                          const selected = paymentMethods.find((item) => item.id.toString() === value);
                          form.setValue("metodo_pagamento", selected?.codigo ?? "OUTRO");
                        }}
                        disabled={isPending}
                      >
                        <div className="flex gap-2">
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <CreditCard className="mr-2 h-4 w-4 text-muted-foreground" />
                              <span className="truncate w-full text-left">
                                {selectedPayment?.nome || "Selecione"}
                              </span>
                            </SelectTrigger>
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="shrink-0"
                            onClick={() => setQuickTypeDialogMode("payment")}
                            disabled={isPending}
                            title="Novo metodo de pagamento"
                            aria-label="Novo metodo de pagamento"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <SelectContent alignItemWithTrigger={false}>
                          {paymentMethods.length === 0 ? (
                            <SelectItem value="__empty" disabled>
                              Cadastre um mÃ©todo em Tipos
                            </SelectItem>
                          ) : (
                            paymentMethods.map((method) => (
                              <SelectItem key={method.id} value={method.id.toString()}>
                                {method.nome}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pendente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LanÃ§amento futuro</FormLabel>
                      <div className="flex h-10 items-center">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isPending} />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="valor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor*</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <WalletCards className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="text"
                            inputMode="decimal"
                            className="pl-9"
                            placeholder="R$ 0,00"
                            required
                            disabled={isPending}
                            value={field.value || ""}
                            onChange={(event) => {
                              const numericValue = event.target.value.replace(/\D/g, "");
                              if (numericValue) {
                                field.onChange(formatCurrency(Number(numericValue) / 100));
                              } else {
                                field.onChange("");
                              }
                            }}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <CalendarClock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input type="datetime-local" className="pl-9" required disabled={isPending} {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="banco_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Banco / Conta</FormLabel>
                      <Select value={field.value || ""} onValueChange={field.onChange} disabled={isPending}>
                        <div className="flex gap-2">
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <span className="truncate text-left">
                                {selectedBank
                                  ? `${selectedBank.titulo} - ${bankAccountTypeLabel(selectedBank.tipo)}`
                                  : "Selecione"}
                              </span>
                            </SelectTrigger>
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="shrink-0"
                            onClick={() => setQuickTypeDialogMode("bank")}
                            disabled={isPending}
                            title="Novo banco / conta"
                            aria-label="Novo banco / conta"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <SelectContent alignItemWithTrigger={false}>
                          {bankAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id.toString()}>
                              {account.titulo} - {bankAccountTypeLabel(account.tipo)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoria_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select
                        value={field.value || ""}
                        onValueChange={(value) => {
                          field.onChange(value);
                          const selected = categories.find((item) => item.id.toString() === value);
                          form.setValue("categoria", selected?.nome ?? "NAO RELACIONADO");
                        }}
                        disabled={isPending || !!saleId}
                      >
                        <div className="flex gap-2">
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                              <span className="truncate w-full text-left">
                                {selectedCategory?.nome || "Selecione"}
                              </span>
                            </SelectTrigger>
                          </FormControl>
                          {!saleId && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="shrink-0"
                              onClick={() => setQuickTypeDialogMode("category")}
                              disabled={isPending}
                              title="Nova categoria"
                              aria-label="Nova categoria"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <SelectContent alignItemWithTrigger={false}>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel>DescriÃ§Ã£o*</FormLabel>
                      <FormControl>
                        <Textarea
                          className="min-h-24 resize-none"
                          placeholder="DescriÃ§Ã£o"
                          required
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="md:col-span-3 ">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-1 items-center gap-3">
                      <span className="text-sm text-muted-foreground">Dados do pagador</span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="customer_id"
                  render={() => (
                    <FormItem className="md:col-span-3 flex flex-col">
                      <FormLabel>Cliente cadastrado</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            readOnly
                            value={selectedCustomer ? `${selectedCustomer.name} - ${formatCpfCnpj(selectedCustomer.cpf_cnpj)}` : ""}
                            placeholder="Nenhum cliente selecionado"
                            className="bg-background/50"
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="shrink-0"
                          onClick={() => setCustomerSelectorOpen(true)}
                          disabled={isPending}
                          title="Selecionar cliente"
                          aria-label="Selecionar cliente"
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="shrink-0"
                          onClick={() => setCustomerDialogOpen(true)}
                          disabled={isPending}
                          title="Novo cliente"
                          aria-label="Novo cliente"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nome_pagador"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do pagador*</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <UserRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input className="pl-9" placeholder="Nome do pagador" required disabled={isPending} {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cpf_cnpj_pagador"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF/CNPJ do pagador*</FormLabel>
                      <FormControl>
                        <Input placeholder="CPF/CNPJ" required disabled={isPending} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="md:col-span-3">
                  <FormLabel>Comprovante</FormLabel>
                  <div className="mt-2 rounded-xl border border-dashed bg-background p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2 text-primary">
                          <Paperclip className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {attachment ? attachment.name : "PDF ou imagem do comprovante"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {attachment ? formatFileSize(attachment.size) : "PDF, JPG, PNG ou WebP atÃ© 50MB"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {attachment && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setAttachment(null);
                              if (attachmentInputRef.current) {
                                attachmentInputRef.current.value = "";
                              }
                            }}
                            disabled={isPending}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => attachmentInputRef.current?.click()}
                          disabled={isPending}
                        >
                          Selecionar arquivo
                        </Button>
                      </div>
                    </div>
                    <Input
                      ref={attachmentInputRef}
                      type="file"
                      accept="application/pdf,image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        if (!file) {
                          setAttachment(null);
                          return;
                        }

                        if (!["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(file.type)) {
                          toast.error("Anexe apenas PDF ou imagem JPG, PNG ou WebP.");
                          event.target.value = "";
                          setAttachment(null);
                          return;
                        }

                        if (file.size > 50 * 1024 * 1024) {
                          toast.error("O comprovante deve ter atÃ© 50MB.");
                          event.target.value = "";
                          setAttachment(null);
                          return;
                        }

                        setAttachment(file);
                      }}
                    />
                  </div>
                </div>

                <input type="hidden" {...form.register("vehicle_id")} />
                <input type="hidden" {...form.register("venda_id")} />
                <input type="hidden" {...form.register("valor_liquido")} />
              </div>
            </ScrollArea>

            <DialogFooter className="shrink-0 border-t bg-card/50 px-8 py-4 backdrop-blur-md">
              <div className="flex w-full justify-end gap-3 pb-4 pr-4">
                <Button type="button" variant="outline" className="rounded-xl px-6" onClick={() => onOpenChange(false)} disabled={isPending}>
                  Cancelar
                </Button>
                <Button type="submit" className="rounded-xl px-8 shadow-lg shadow-primary/20" disabled={isPending}>
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar transaÃ§Ã£o
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    <TypeCreateDialog
      mode={quickTypeDialogMode}
      target={null}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setQuickTypeDialogMode(null);
      }}
      onSuccess={() => {
        setQuickTypeDialogMode(null);
        fetchOptions({ preserveSelection: true });
      }}
    />
    <CustomerDialog
      open={customerDialogOpen}
      onOpenChange={setCustomerDialogOpen}
      customer={null}
      onSuccess={() => {
        setCustomerDialogOpen(false);
        fetchCustomers({ selectNewest: true });
      }}
    />
    <CustomerSelectorDialog
      open={customerSelectorOpen}
      onOpenChange={setCustomerSelectorOpen}
      onSelect={selectCustomer}
    />
    </>
  );
}
