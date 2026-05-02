import sys

with open('src/components/finance/transaction-dialog.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace 1: Add saleId and saleValue to Props
content = content.replace(
'''type TransactionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  vehicle?: VehicleOption | null;
};''',
'''type TransactionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  vehicle?: VehicleOption | null;
  saleId?: number | null;
  saleValue?: number | null;
};'''
)

# Replace 2: Add to function signature
content = content.replace(
'''export function TransactionDialog({
  open,
  onOpenChange,
  onSuccess,
  vehicle,
}: TransactionDialogProps) {''',
'''export function TransactionDialog({
  open,
  onOpenChange,
  onSuccess,
  vehicle,
  saleId,
  saleValue,
}: TransactionDialogProps) {'''
)

# Replace 3: Update defaultValues in useForm
content = content.replace(
'''    defaultValues: {
      descricao: "",
      valor: "",
      data: nowForInput(),
      metodo_pagamento: "PIX",
      categoria: "NAO RELACIONADO",
      tipo: "RECEITA",
      vehicle_id: vehicle?.id ?? "",
      venda_id: "",
      customer_id: "",''',
'''    defaultValues: {
      descricao: "",
      valor: saleValue ? formatCurrency(saleValue) : "",
      data: nowForInput(),
      metodo_pagamento: "PIX",
      categoria: "NAO RELACIONADO",
      tipo: "RECEITA",
      vehicle_id: vehicle?.id ?? "",
      venda_id: saleId ? saleId.toString() : "",
      customer_id: "",'''
)

# Replace 4: Update form.reset
content = content.replace(
'''    form.reset({
      descricao: "",
      valor: "",
      data: nowForInput(),
      metodo_pagamento: "PIX",
      categoria: "NAO RELACIONADO",
      tipo: "RECEITA",
      vehicle_id: vehicle?.id ?? "",
      venda_id: "",
      customer_id: "",''',
'''    form.reset({
      descricao: "",
      valor: saleValue ? formatCurrency(saleValue) : "",
      data: nowForInput(),
      metodo_pagamento: "PIX",
      categoria: "NAO RELACIONADO",
      tipo: "RECEITA",
      vehicle_id: vehicle?.id ?? "",
      venda_id: saleId ? saleId.toString() : "",
      customer_id: "",'''
)

# Replace 5: Update useEffect dependencies
content = content.replace(
'''    return () => clearTimeout(timeout);
  }, [form, open, vehicle?.id]);''',
'''    return () => clearTimeout(timeout);
  }, [form, open, vehicle?.id, saleId, saleValue]);'''
)

with open('src/components/finance/transaction-dialog.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Success')
