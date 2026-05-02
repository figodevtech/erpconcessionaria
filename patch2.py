import sys

with open('src/actions/transactions.ts', 'r', encoding='utf-8') as f:
    content = f.read()

target = '''  const { data, error } = await admin
    .from("transactions")
    .insert(payload)
    .select(getTransactionSelect())
    .single();

  if (error) return { success: false, error: error.message };

  let transaction = mapTransaction(data as unknown as Record<string, unknown>);'''

replacement = '''  const { data, error } = await admin
    .from("transactions")
    .insert(payload)
    .select(getTransactionSelect())
    .single();

  if (error) return { success: false, error: error.message };

  let transaction = mapTransaction(data as unknown as Record<string, unknown>);

  // If this transaction is linked to a sale, complete the sale workflow
  if (payload.venda_id) {
    await admin.from("sales").update({ status: 'CONCLUIDA' }).eq("id", payload.venda_id);
    
    if (payload.vehicle_id) {
      await admin.from("vehicles").update({ status: 'Vendido' }).eq("id", payload.vehicle_id);
    }
  }'''

if target in content:
    content = content.replace(target, replacement)
    with open('src/actions/transactions.ts', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Success")
else:
    print("Target not found!")
