"use client"

import { useState, useEffect, useTransition } from "react"
import { useForm } from "react-hook-form"
import { Loader2, DollarSign, Store, User, Percent, BadgeCheck, XCircle, ArrowRight, ReceiptText } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Vehicle } from "./vehicle-list-client"
import { getVehicleSaleAction, registerVehicleSaleAction, cancelVehicleSaleAction } from "@/actions/sales"
import { listUsersAction } from "@/actions/users"
import { getTypeCatalogAction } from "@/actions/type-catalog"
import { formatCurrency, parseCurrency } from "@/lib/utils"
import { TransactionDialog } from "@/components/finance/transaction-dialog"
import { TransactionTable } from "@/components/finance/transaction-table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"

// Needs to match the actual customers action, but for now we'll do a simple fetch
// since there's no listCustomersAction exported the same way, we can use supabase client
import { createClient } from "@/utils/supabase/client"
import { usePermissions } from "@/hooks/use-permissions"

interface VehicleSaleTabProps {
  vehicle: Vehicle
  onSuccess: (updatedVehicle?: Vehicle) => void
}

export function VehicleSaleTab({ vehicle, onSuccess }: VehicleSaleTabProps) {
  const { hasPermission } = usePermissions()
  const canSell = hasPermission("vehicles:update") // or a specific "sales:create"

  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)
  const [saleData, setSaleData] = useState<any>(null)

  const [customers, setCustomers] = useState<any[]>([])
  const [sellers, setSellers] = useState<any[]>([])
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])

  const [cancelPending, startCancelTransition] = useTransition()
  const [shouldDeleteTransactions, setShouldDeleteTransactions] = useState(true)
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false)
  
  const [customerSearch, setCustomerSearch] = useState("")
  const [sellerSearch, setSellerSearch] = useState("")

  const filteredCustomers = customers.filter(c => 
    !customerSearch || 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
    (c.cpf_cnpj && c.cpf_cnpj.includes(customerSearch))
  )

  const filteredSellers = sellers.filter(s => 
    !sellerSearch || 
    s.name.toLowerCase().includes(sellerSearch.toLowerCase())
  )

  const isSoldOrInPayment = vehicle.status === "Vendido" || vehicle.status === "Pagamento"

  const form = useForm({
    defaultValues: {
      vehicle_id: vehicle.id.toString(),
      customer_id: "",
      seller_id: "",
      sub_total: vehicle.price || 0,
      discount_type: "VALOR_FIXO",
      discount_value: 0,
      total_value: vehicle.price || 0,
      payment_method: "",
      fiscal_observations: "",
      commission_percent_applied: "",
    },
  })

  // Watch for changes to calculate total
  const subTotal = Number(form.watch("sub_total") || 0)
  const discountType = form.watch("discount_type")
  const discountValue = Number(form.watch("discount_value") || 0)
  const sellerId = form.watch("seller_id")

  useEffect(() => {
    let total = subTotal
    if (discountType === "VALOR_FIXO") {
      total = subTotal - discountValue
    } else if (discountType === "PERCENTUAL") {
      total = subTotal - (subTotal * (discountValue / 100))
    }

    // update total_value without triggering infinite loop
    if (total !== Number(form.getValues("total_value") || 0)) {
      form.setValue("total_value", total)
    }
  }, [subTotal, discountType, discountValue, form])

  // Automatically pull commission when seller changes
  useEffect(() => {
    if (sellerId && sellers.length > 0) {
      const seller = sellers.find(s => s.id === sellerId)
      if (seller && seller.commission_percent !== null) {
        form.setValue("commission_percent_applied", seller.commission_percent.toString())
      } else {
        form.setValue("commission_percent_applied", "")
      }
    }
  }, [sellerId, sellers, form])


  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const supabase = createClient()

        // 1. Fetch Customers
        const { data: customersData } = await supabase
          .from("customers")
          .select("id, name, cpf_cnpj")
          .order("name")
        setCustomers(customersData || [])

        // 2. Fetch Sellers (Users)
        const usersResult = await listUsersAction({ pageSize: 100 })
        if (usersResult.success) {
          setSellers(usersResult.data || [])
        }

        // 3. Fetch Payment Methods
        const catalogResult = await getTypeCatalogAction()
        if (catalogResult.success && catalogResult.data) {
          setPaymentMethods(catalogResult.data.paymentMethods.filter((p: any) => p.ativo))
        }

        // 3. Fetch Sale if already sold
        if (isSoldOrInPayment) {
          const saleResult = await getVehicleSaleAction(Number(vehicle.id))
          if (saleResult.success && saleResult.data) {
            setSaleData(saleResult.data)
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (vehicle.id) {
      loadData()
    }
  }, [vehicle.id, isSoldOrInPayment, vehicle])

  async function onSubmit(data: any) {
    if (!canSell) {
      toast.error("Você não tem permissão para registrar vendas.")
      return
    }

    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value as string)
    })

    startTransition(async () => {
      const result = await registerVehicleSaleAction(formData)
      if (result.success) {
        toast.success("Venda registrada com sucesso!")
        onSuccess(result.vehicle)
      } else {
        toast.error("Erro: " + result.error)
      }
    })
  }

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isSoldOrInPayment && saleData && saleData.status !== 'CANCELADA') {
    return (
      <div className="p-6 space-y-6">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <BadgeCheck className="w-32 h-32" />
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-full bg-primary/20 text-primary">
              <BadgeCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-primary">
                {saleData.status === 'PENDENTE'
                  ? (saleData.total_paid > 0 ? "Pagamento Parcial Realizado" : "Venda Aguardando Pagamento")
                  : "Veículo Vendido"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {saleData.status === 'PENDENTE'
                  ? (saleData.total_paid > 0
                    ? `Recebemos ${formatCurrency(saleData.total_paid)}. Aguardando o saldo de ${formatCurrency(saleData.total_value - saleData.total_paid)}.`
                    : "Esta venda foi registrada, mas nenhum pagamento foi confirmado ainda.")
                  : "Esta venda foi registrada no sistema e 100% concluída."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Cliente</p>
              <p className="font-medium text-lg">{saleData.customer?.name}</p>
              <p className="text-sm text-muted-foreground">{saleData.customer?.cpf_cnpj}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Vendedor</p>
              <p className="font-medium text-lg">{saleData.seller?.name || "N/A"}</p>
              <p className="text-sm text-muted-foreground">Comissão: {saleData.commission_percent_applied}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Data da Venda</p>
              <p className="font-medium text-lg">{new Date(saleData.sale_date).toLocaleDateString('pt-BR')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Valor Sub-Total</p>
              <p className="font-medium text-lg">{formatCurrency(saleData.sub_total)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Desconto</p>
              <p className="font-medium text-lg text-red-500">
                {saleData.discount_value > 0 ? (
                  saleData.discount_type === 'PERCENTUAL'
                    ? `-${saleData.discount_value}%`
                    : `-${formatCurrency(saleData.discount_value)}`
                ) : 'Nenhum'}
              </p>
            </div>
            <div>
              <p className="text-sm text-primary mb-1 font-semibold">Valor Total</p>
              <p className="font-bold text-2xl text-primary">{formatCurrency(saleData.total_value)}</p>
            </div>
            <div>
              <p className="text-sm text-emerald-500 mb-1 font-semibold">Total Pago</p>
              <p className="font-bold text-2xl text-emerald-500">{formatCurrency(saleData.total_paid)}</p>
            </div>
            {saleData.total_value - saleData.total_paid > 0 && (
              <div>
                <p className="text-sm text-amber-500 mb-1 font-semibold">Saldo Devedor</p>
                <p className="font-bold text-2xl text-amber-500">{formatCurrency(saleData.total_value - saleData.total_paid)}</p>
              </div>
            )}
          </div>

          <div className="mt-8 flex items-center justify-end gap-4 border-t border-primary/10 pt-6 relative z-10">
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10" disabled={cancelPending}>
                    {cancelPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Cancelar Venda
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação cancelará a venda do veículo e o retornará para o estoque. O histórico da venda será mantido como cancelado.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="flex items-center space-x-2 py-4">
                  <Checkbox
                    id="delete-transactions"
                    checked={shouldDeleteTransactions}
                    onCheckedChange={(checked) => setShouldDeleteTransactions(!!checked)}
                  />
                  <Label
                    htmlFor="delete-transactions"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Excluir todas as transações de pagamento desta venda
                  </Label>
                </div>

                <AlertDialogFooter>
                  <AlertDialogCancel className="mr-2">Voltar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => {
                    startCancelTransition(async () => {
                      const result = await cancelVehicleSaleAction(saleData.id, Number(vehicle.id), shouldDeleteTransactions)
                      if (result.success) {
                        toast.success("Venda cancelada com sucesso!")
                        setSaleData(null)
                        onSuccess(result.vehicle)
                      } else {
                        toast.error(result.error)
                      }
                    })
                  }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Confirmar Cancelamento
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {saleData.status === 'PENDENTE' && (
              <Button onClick={() => setTransactionDialogOpen(true)}>
                Registrar Pagamento
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-4 border-b bg-muted/50">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <ReceiptText className="w-4 h-4 text-primary" />
              Histórico de Pagamentos da Venda
            </h4>
          </div>
          <div className="p-0">
            <TransactionTable
              transactions={saleData.transactions || []}
              loading={loading}
              onChanged={(v) => onSuccess(v)}
              compact
            />
          </div>
        </div>

        {transactionDialogOpen && (
          <TransactionDialog
            open={transactionDialogOpen}
            onOpenChange={setTransactionDialogOpen}
            onSuccess={(v) => {
              setTransactionDialogOpen(false)
              onSuccess(v)
            }}
            vehicle={vehicle}
            saleId={saleData.id}
            saleValue={saleData.total_value - saleData.total_paid}
          />
        )}
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Registrar Venda</h3>
          <p className="text-sm text-muted-foreground">Preencha os dados abaixo para finalizar a venda deste veículo.</p>
        </div>
      </div>

      <Form {...form}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="customer_id"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Cliente</FormLabel>
                  <Combobox
                    items={customers}
                    value={field.value}
                    onValueChange={field.onChange}
                    inputValue={customerSearch}
                    onInputValueChange={setCustomerSearch}
                    disabled={isPending || loading}
                  >
                    <FormControl>
                      <ComboboxInput
                        placeholder="Pesquisar cliente por nome ou CPF/CNPJ..."
                        className="w-full bg-background/50"
                      />
                    </FormControl>
                    <ComboboxContent>
                      <ComboboxEmpty>Nenhum cliente encontrado.</ComboboxEmpty>
                      <ComboboxList>
                        {filteredCustomers.map((customer: any) => (
                          <ComboboxItem key={customer.id} value={customer.id.toString()}>
                            <div className="flex flex-col">
                              <span>{customer.name}</span>
                              <span className="text-xs text-muted-foreground">{customer.cpf_cnpj}</span>
                            </div>
                          </ComboboxItem>
                        ))}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="seller_id"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Vendedor</FormLabel>
                  <Combobox
                    items={sellers}
                    value={field.value}
                    onValueChange={field.onChange}
                    inputValue={sellerSearch}
                    onInputValueChange={setSellerSearch}
                    disabled={isPending || loading}
                  >
                    <FormControl>
                      <ComboboxInput
                        placeholder="Pesquisar vendedor..."
                        className="w-full bg-background/50"
                      />
                    </FormControl>
                    <ComboboxContent>
                      <ComboboxEmpty>Nenhum vendedor encontrado.</ComboboxEmpty>
                      <ComboboxList>
                        {filteredSellers.map((seller: any) => (
                          <ComboboxItem key={seller.id} value={seller.id.toString()}>
                            {seller.name}
                          </ComboboxItem>
                        ))}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sub_total"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor de Venda</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="R$ 0,00"
                      className="font-semibold"
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
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="discount_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Desconto</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isPending}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo">
                            {field.value === "VALOR_FIXO" ? "Valor Fixo (R$)" : field.value === "PERCENTUAL" ? "Percentual (%)" : "Selecione o tipo"}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent align="start" alignItemWithTrigger={false}>
                        <SelectItem value="VALOR_FIXO">Valor Fixo (R$)</SelectItem>
                        <SelectItem value="PERCENTUAL">Percentual (%)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discount_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor do Desconto</FormLabel>
                    <FormControl>
                      {discountType === "VALOR_FIXO" ? (
                        <Input
                          type="text"
                          placeholder="R$ 0,00"
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
                          disabled={isPending}
                        />
                      ) : (
                        <div className="relative">
                          <Percent className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input type="number" step="0.01" {...field} disabled={isPending} />
                        </div>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="total_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Total Final</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      className="font-bold text-primary text-lg bg-primary/5"
                      readOnly
                      value={field.value ? formatCurrency(field.value) : "R$ 0,00"}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="commission_percent_applied"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comissão do Vendedor (%)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Percent className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input type="number" step="0.01" className="pl-9" {...field} disabled={isPending} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de Pagamento</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isPending}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o método de pagamento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent alignItemWithTrigger={false}>
                      {paymentMethods.map((p) => (
                        <SelectItem key={p.id} value={p.nome}>
                          {p.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="fiscal_observations"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observações Fiscais / Notas</FormLabel>
                <FormControl>
                  <Textarea className="min-h-[100px]" placeholder="Anotações sobre a venda, notas promissórias, etc." {...field} disabled={isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end pt-4">
            <Button
              type="button"
              onClick={form.handleSubmit(onSubmit)}
              disabled={isPending || !canSell}
              className="px-8 rounded-xl shadow-lg active:scale-[0.98] transition-transform"
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="mr-2 h-4 w-4" />
              )}
              Confirmar Venda
            </Button>
          </div>
        </div>
      </Form>
    </div>
  )
}
