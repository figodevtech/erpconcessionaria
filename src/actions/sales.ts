"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"

export async function getVehicleSaleAction(vehicleId: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("sales")
    .select(`
      *,
      customer:customers(name, cpf_cnpj, email, phone),
      seller:users!sales_seller_id_fkey(name, email)
    `)
    .eq("vehicle_id", vehicleId)
    .neq("status", "CANCELADA")
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (data) {
    const { data: transactions } = await supabase
      .from("transactions")
      .select("*, category:transaction_categories(id, nome), payment_method:payment_methods(id, nome, codigo), attachments:transaction_attachments(*)")
      .eq("venda_id", data.id)
      .eq("is_deleted", false)
      .eq("pendente", false)

    const totalPaid = (transactions ?? []).reduce((acc, t) => acc + Number(t.valor), 0)
    data.total_paid = totalPaid
    data.transactions = transactions || []
  }

  return { success: true, data: data || null }
}

export async function registerVehicleSaleAction(formData: FormData) {
  const supabase = await createClient()

  // Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: "Usuário não autenticado." }
  }

  const vehicle_id = formData.get("vehicle_id") as string
  const customer_id = formData.get("customer_id") as string
  const seller_id = formData.get("seller_id") as string
  const total_value = formData.get("total_value") as string
  const sub_total = formData.get("sub_total") as string
  const discount_type = formData.get("discount_type") as string
  const discount_value = formData.get("discount_value") as string
  const payment_method = formData.get("payment_method") as string
  const fiscal_observations = formData.get("fiscal_observations") as string
  const commission_percent_applied = formData.get("commission_percent_applied") as string

  if (!vehicle_id || !customer_id || !total_value || !sub_total) {
    return { success: false, error: "Campos obrigatórios ausentes." }
  }

  // 1. Insert into sales table
  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert({
      vehicle_id: parseInt(vehicle_id),
      customer_id: parseInt(customer_id),
      seller_id: seller_id || null,
      status: 'PENDENTE',
      total_value: parseFloat(total_value),
      sub_total: parseFloat(sub_total),
      discount_type: discount_type || null,
      discount_value: discount_value ? parseFloat(discount_value) : null,
      payment_method: payment_method || null,
      fiscal_observations: fiscal_observations || null,
      commission_percent_applied: commission_percent_applied ? parseFloat(commission_percent_applied) : null,
      created_by: user.id
    })
    .select()
    .single()

  if (saleError) {
    return { success: false, error: "Erro ao registrar venda: " + saleError.message }
  }

  // 2. Update vehicle status to 'Pagamento'
  const { error: vehicleError } = await supabase
    .from("vehicles")
    .update({ status: 'Pagamento' })
    .eq("id", parseInt(vehicle_id))

  if (vehicleError) {
    return { success: false, error: "Venda registrada, mas erro ao atualizar status do veículo: " + vehicleError.message }
  }

  // 3. Fetch updated vehicle
  const { data: updatedVehicle, error: fetchError } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", parseInt(vehicle_id))
    .single()

  revalidatePath("/veiculos")
  revalidatePath("/dashboard")
  
  return { success: true, data: sale, vehicle: updatedVehicle || null }
}

export async function cancelVehicleSaleAction(saleId: number, vehicleId: number) {
  const supabase = await createClient()

  // Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: "Usuário não autenticado." }
  }

  // 1. Update sale to CANCELADA and record who canceled
  const { error: saleError } = await supabase
    .from("sales")
    .update({ 
      status: 'CANCELADA',
      updated_at: new Date().toISOString(),
      updated_by: user.id
    })
    .eq("id", saleId)

  if (saleError) {
    return { success: false, error: "Erro ao cancelar venda: " + saleError.message }
  }

  // 2. Update vehicle back to 'Em venda'
  const { error: vehicleError } = await supabase
    .from("vehicles")
    .update({ status: 'Em venda' })
    .eq("id", vehicleId)

  if (vehicleError) {
    return { success: false, error: "Venda cancelada, mas erro ao atualizar status do veículo: " + vehicleError.message }
  }

  // 3. Fetch updated vehicle
  const { data: updatedVehicle, error: fetchError } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", vehicleId)
    .single()

  revalidatePath("/veiculos")
  revalidatePath("/dashboard")
  
  return { success: true, vehicle: updatedVehicle || null }
}
