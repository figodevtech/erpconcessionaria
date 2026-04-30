"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  CalendarClock,
  CreditCard,
  FileText,
  Loader2,
  ReceiptText,
  UserRound,
  WalletCards,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { createTransactionAction } from "@/actions/transactions";
import { getTypeCatalogAction } from "@/actions/type-catalog";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  type TransactionFormValues,
} from "@/lib/transactions";
import { bankAccountTypeLabel, type BankAccount, type DynamicPaymentMethod, type TransactionCategory } from "@/lib/type-catalog";

type VehicleOption = {
  id: string;
  brand: string;
  model: string;
  plate?: string | null;
};

type TransactionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  vehicle?: VehicleOption | null;
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
}: TransactionDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<DynamicPaymentMethod[]>([]);

  const form = useForm<TransactionFormValues>({
    defaultValues: {
      descricao: "",
      valor: "",
      data: nowForInput(),
      metodo_pagamento: "PIX",
      categoria: "NAO RELACIONADO",
      tipo: "RECEITA",
      vehicle_id: vehicle?.id ?? "",
      venda_id: "",
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

  useEffect(() => {
    if (!open) return;

    form.reset({
      descricao: "",
      valor: "",
      data: nowForInput(),
      metodo_pagamento: "PIX",
      categoria: "NAO RELACIONADO",
      tipo: "RECEITA",
      vehicle_id: vehicle?.id ?? "",
      venda_id: "",
      categoria_id: "",
      banco_id: "",
      payment_method_id: "",
      nome_pagador: "",
      cpf_cnpj_pagador: "",
      valor_liquido: "",
      pendente: false,
    });
  }, [form, open, vehicle?.id]);

  useEffect(() => {
    if (!open) return;

    async function fetchOptions() {
      try {
        const typesResult = await getTypeCatalogAction();

        if (typesResult.success && typesResult.data) {
          const activeCategories = typesResult.data.categories.filter((item) => item.ativo);
          const activeBanks = typesResult.data.bankAccounts.filter((item) => item.ativo);
          const activePayments = typesResult.data.paymentMethods.filter((item) => item.ativo);

          setCategories(activeCategories);
          setBankAccounts(activeBanks);
          setPaymentMethods(activePayments);

          form.setValue("categoria_id", activeCategories[0]?.id.toString() ?? "");
          form.setValue("categoria", activeCategories[0]?.nome ?? "NAO RELACIONADO");
          form.setValue("banco_id", activeBanks[0]?.id.toString() ?? "");
          form.setValue("payment_method_id", activePayments[0]?.id.toString() ?? "");
          form.setValue("metodo_pagamento", activePayments[0]?.codigo ?? "PIX");
        }
      } catch {}
    }

    fetchOptions();
  }, [form, open]);

  function onSubmit(values: TransactionFormValues) {
    startTransition(async () => {
      const result = await createTransactionAction(values);
      if (result.success) {
        toast.success("Transacao lancada com sucesso");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.error ?? "Erro ao criar transacao");
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-svh w-[100dvw] max-w-[100dvw] flex-col overflow-hidden border-none p-0 shadow-2xl sm:max-h-[min(90vh,850px)] sm:w-[95vw] sm:max-w-[980px]">
        <DialogHeader className="shrink-0 border-b bg-card/50 px-8 py-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <ReceiptText className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold tracking-tight">
                Nova transacao
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-muted-foreground">
                Lance uma receita ou despesa vinculada ao caixa, a uma venda ou a um veiculo.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
            <ScrollArea className="flex-1 overflow-y-auto bg-muted-foreground/5">
              <div className="grid grid-cols-1 gap-6 p-8 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange} disabled={isPending}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <span className="truncate text-left">{selectedTypeLabel || "Selecione"}</span>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent alignItemWithTrigger={false}>
                          <SelectItem value="RECEITA">Receita</SelectItem>
                          <SelectItem value="DESPESA">Despesa</SelectItem>
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
                      <FormLabel>Metodo de pagamento</FormLabel>
                      <Select
                        value={field.value || ""}
                        onValueChange={(value) => {
                          field.onChange(value);
                          const selected = paymentMethods.find((item) => item.id.toString() === value);
                          form.setValue("metodo_pagamento", selected?.codigo ?? "OUTRO");
                        }}
                        disabled={isPending}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <CreditCard className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span className="truncate text-left">
                              {selectedPayment?.nome || "Selecione"}
                            </span>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent alignItemWithTrigger={false}>
                          {paymentMethods.length === 0 ? (
                            <SelectItem value="__empty" disabled>
                              Cadastre um metodo em Tipos
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
                      <FormLabel>Lancamento futuro</FormLabel>
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
                          <Input className="pl-9" placeholder="R$ 0,00" required disabled={isPending} {...field} />
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
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <span className="truncate text-left">
                              {selectedBank
                                ? `${selectedBank.titulo} - ${bankAccountTypeLabel(selectedBank.tipo)}`
                                : "Selecione"}
                            </span>
                          </SelectTrigger>
                        </FormControl>
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
                        disabled={isPending}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span className="truncate text-left">
                              {selectedCategory?.nome || "Selecione"}
                            </span>
                          </SelectTrigger>
                        </FormControl>
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
                    <FormItem className="md:col-span-2">
                      <FormLabel>Descricao*</FormLabel>
                      <FormControl>
                        <Textarea
                          className="min-h-24 resize-none"
                          placeholder="Descricao"
                          required
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="md:col-span-2">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-1 items-center gap-3">
                      <span className="text-sm text-muted-foreground">Dados do pagador</span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                  </div>
                </div>

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
                  Salvar transacao
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
