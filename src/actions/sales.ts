"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient, createClient } from "@/utils/supabase/server"

export async function getVehicleSaleAction(vehicleId: number) {
  const supabase = await createClient()

  const { data, error: _error } = await supabase
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
  const { data: updatedVehicle, error: _fetchError } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", parseInt(vehicle_id))
    .single()

  revalidatePath("/veiculos")
  revalidatePath("/dashboard")
  
  return { success: true, data: sale, vehicle: updatedVehicle || null }
}

export async function cancelVehicleSaleAction(saleId: number, vehicleId: number, deleteTransactions: boolean = false) {
  const supabase = await createClient()

  // Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: "Usuário não autenticado." }
  }

  const { supabase: admin, error: adminError } = await createAdminClient();
  if (adminError || !admin) {
    return { success: false, error: "Erro ao configurar cliente administrativo." }
  }

  // 1. Update sale to CANCELADA and record who canceled
  const { error: saleError } = await admin
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

  // 2. Optional: Delete associated transactions
  if (deleteTransactions) {
    const { data: transactions } = await admin
      .from("transactions")
      .select("id")
      .eq("venda_id", saleId)
      .eq("is_deleted", false)

    if (transactions && transactions.length > 0) {
      const txIds = transactions.map(t => t.id)

      // Fetch and remove attachments
      const { data: attachments } = await admin
        .from("transaction_attachments")
        .select("file_path")
        .in("transaction_id", txIds)
        .eq("is_deleted", false)

      if (attachments && attachments.length > 0) {
        const paths = attachments.map(a => a.file_path).filter(Boolean)
        if (paths.length > 0) {
          await admin.storage.from("transaction-attachments").remove(paths)
        }

        await admin
          .from("transaction_attachments")
          .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            deleted_by: user.id,
            updated_by: user.id,
            updated_at: new Date().toISOString(),
          })
          .in("transaction_id", txIds)
      }

      // Mark transactions as deleted
      await admin
        .from("transactions")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: user.id,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .in("id", txIds)
    }
  }

  // 3. Update vehicle back to 'Em venda'
  const { error: vehicleError } = await admin
    .from("vehicles")
    .update({ status: 'Em venda' })
    .eq("id", vehicleId)

  if (vehicleError) {
    return { success: false, error: "Venda cancelada, mas erro ao atualizar status do veículo: " + vehicleError.message }
  }

  // 4. Fetch updated vehicle
  const { data: updatedVehicle } = await admin
    .from("vehicles")
    .select("*")
    .eq("id", vehicleId)
    .single()

  revalidatePath("/veiculos")
  revalidatePath("/dashboard")
  revalidatePath("/financeiro")
  
  return { success: true, vehicle: updatedVehicle || null }
}

export async function listSalesAction({
  page = 1,
  pageSize = 12,
  search = "",
  status = "Todos",
}: {
  page?: number
  pageSize?: number
  search?: string
  status?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from("sales")
    .select(`
      *,
      customer:customers(name, cpf_cnpj, email, phone),
      vehicle:vehicles(id, brand, model, plate, year_model),
      seller:users!sales_seller_id_fkey(name, email)
    `, { count: "exact" })

  if (status && status !== "Todos") {
    query = query.eq("status", status)
  }

  if (search) {
    // Search by customer name, vehicle brand, or vehicle model
    // Note: Supabase's simple text search might need tuning for relationships
    // A simpler approach for now is to fetch and filter, but that breaks pagination
    // Ideally we'd have a view or text search column. We'll do a basic filter for now.
    query = query.or(`customer.name.ilike.%${search}%,vehicle.brand.ilike.%${search}%,vehicle.model.ilike.%${search}%`)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  query = query.order("created_at", { ascending: false }).range(from, to)

  const { data, count, error } = await query

  if (error) {
    console.error("List sales error:", error)
    return { success: false, error: "Falha ao buscar vendas.", data: [], count: 0 }
  }

  return { success: true, data: data || [], count: count || 0 }
}

export async function getSalesKpisAction() {
  const supabase = await createClient()
  
  // Basic KPIs: Total sales count, Total Revenue, Pending Revenue
  
  const { data: sales, error } = await supabase
    .from("sales")
    .select("status, total_value")
    .neq("status", "CANCELADA")

  if (error) {
    console.error("KPI sales error:", error)
    return { 
      success: false, 
      data: {
        totalSales: 0,
        completedRevenue: 0,
        pendingRevenue: 0,
        averageTicket: 0
      } 
    }
  }

  let totalSales = 0
  let completedRevenue = 0
  let pendingRevenue = 0

  sales?.forEach(sale => {
    totalSales++
    if (sale.status === 'CONCLUIDA') {
      completedRevenue += Number(sale.total_value || 0)
    } else if (sale.status === 'PENDENTE') {
      pendingRevenue += Number(sale.total_value || 0)
    }
  })

  const averageTicket = totalSales > 0 ? (completedRevenue + pendingRevenue) / totalSales : 0

  return { 
    success: true, 
    data: {
      totalSales,
      completedRevenue,
      pendingRevenue,
      averageTicket
    } 
  }
}

export async function getSaleByIdAction(saleId: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("sales")
    .select(`
      *,
      customer:customers(name, cpf_cnpj, email, phone),
      vehicle:vehicles(id, brand, model, plate, year_model, price, status),
      seller:users!sales_seller_id_fkey(name, email)
    `)
    .eq("id", saleId)
    .single()

  if (error || !data) {
    return { success: false, error: "Venda não encontrada." }
  }

  // Fetch transactions
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*, category:transaction_categories(id, nome), payment_method:payment_methods(id, nome, codigo), attachments:transaction_attachments(*)")
    .eq("venda_id", saleId)
    .eq("is_deleted", false)
    .eq("pendente", false)

  const totalPaid = (transactions ?? []).reduce((acc, t) => acc + Number(t.valor), 0)
  data.total_paid = totalPaid
  data.transactions = transactions || []

  return { success: true, data }
}
