import sys

with open('src/app/(app)/veiculos/components/vehicle-sale-tab.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Imports
imports_target = '''import { getVehicleSaleAction, registerVehicleSaleAction } from "@/actions/sales"
import { listUsersAction } from "@/actions/users"
import { formatCurrency, parseCurrency } from "@/lib/utils"'''

imports_replacement = '''import { getVehicleSaleAction, registerVehicleSaleAction, cancelVehicleSaleAction } from "@/actions/sales"
import { listUsersAction } from "@/actions/users"
import { formatCurrency, parseCurrency } from "@/lib/utils"
import { TransactionDialog } from "@/components/finance/transaction-dialog"
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
} from "@/components/ui/alert-dialog"'''

if imports_target in content:
    content = content.replace(imports_target, imports_replacement)
else:
    print("Warning: Imports target not found")

# Replace isSold
state_target = '''  const [sellers, setSellers] = useState<any[]>([])

  const isSold = vehicle.status === "Vendido"'''

state_replacement = '''  const [sellers, setSellers] = useState<any[]>([])

  const [cancelPending, startCancelTransition] = useTransition()
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false)

  const isSoldOrInPayment = vehicle.status === "Vendido" || vehicle.status === "Pagamento"'''

if state_target in content:
    content = content.replace(state_target, state_replacement)
else:
    print("Warning: State target not found")

# Replace useEffect dependency
deps_target = '''    if (vehicle.id) {
      loadData()
    }
  }, [vehicle.id, isSold])'''

deps_replacement = '''    if (vehicle.id) {
      loadData()
    }
  }, [vehicle.id, isSoldOrInPayment])'''

if deps_target in content:
    content = content.replace(deps_target, deps_replacement)
else:
    print("Warning: Deps target not found")

# Replace isSold in useEffect
is_sold_target = '''        // 3. Fetch Sale if already sold
        if (isSold) {
          const saleResult = await getVehicleSaleAction(Number(vehicle.id))'''

is_sold_replacement = '''        // 3. Fetch Sale if already sold
        if (isSoldOrInPayment) {
          const saleResult = await getVehicleSaleAction(Number(vehicle.id))'''

if is_sold_target in content:
    content = content.replace(is_sold_target, is_sold_replacement)
else:
    print("Warning: isSold target not found")


# Replace rendering
render_target = '''  if (isSold && saleData) {
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
              <h3 className="text-xl font-semibold text-primary">Veículo Vendido</h3>
              <p className="text-sm text-muted-foreground">Esta venda foi registrada no sistema.</p>
            </div>
          </div>'''

render_replacement = '''  if (isSoldOrInPayment && saleData && saleData.status !== 'CANCELADA') {
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
                {saleData.status === 'PENDENTE' ? "Venda Aguardando Pagamento" : "Veículo Vendido"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {saleData.status === 'PENDENTE' 
                  ? "Esta venda foi registrada, mas o pagamento ainda não foi confirmado." 
                  : "Esta venda foi registrada no sistema e concluída."}
              </p>
            </div>
          </div>'''

if render_target in content:
    content = content.replace(render_target, render_replacement)
else:
    print("Warning: Render target not found")

# Replace render end
render_end_target = '''            <div>
              <p className="text-sm text-primary mb-1 font-semibold">Valor Total</p>
              <p className="font-bold text-2xl text-primary">{formatCurrency(saleData.total_value)}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }'''

render_end_replacement = '''            <div>
              <p className="text-sm text-primary mb-1 font-semibold">Valor Total</p>
              <p className="font-bold text-2xl text-primary">{formatCurrency(saleData.total_value)}</p>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-4 border-t border-primary/10 pt-6 relative z-10">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10" disabled={cancelPending}>
                  {cancelPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Cancelar Venda
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação cancelará a venda do veículo e o retornará para o estoque. O histórico será mantido como cancelado.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Voltar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => {
                    startCancelTransition(async () => {
                      const result = await cancelVehicleSaleAction(saleData.id, vehicle.id)
                      if (result.success) {
                        toast.success("Venda cancelada com sucesso!")
                        setSaleData(null)
                        onSuccess()
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
        
        {transactionDialogOpen && (
          <TransactionDialog
            open={transactionDialogOpen}
            onOpenChange={setTransactionDialogOpen}
            onSuccess={() => {
              setTransactionDialogOpen(false)
              onSuccess()
            }}
            vehicle={vehicle}
            saleId={saleData.id}
            saleValue={saleData.total_value}
          />
        )}
      </div>
    )
  }'''

if render_end_target in content:
    content = content.replace(render_end_target, render_end_replacement)
else:
    print("Warning: Render end target not found")


with open('src/app/(app)/veiculos/components/vehicle-sale-tab.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Success patch3")
