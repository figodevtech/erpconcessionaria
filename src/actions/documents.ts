"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/utils/supabase/server";
import { checkPermission } from "@/utils/permissions";
import type { VehicleDocument } from "@/lib/documents";

const BUCKET = "vehicle-documents";

type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

function mapDocument(row: Record<string, unknown>): VehicleDocument {
  return {
    ...(row as Omit<VehicleDocument, "file_size">),
    file_size: row.file_size == null ? null : Number(row.file_size),
  };
}

function documentSelect() {
  return "*, category:document_categories(id, nome)";
}

function sanitizeFileName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

async function requireAdmin(permission: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Usuario nao autenticado.", user: null, admin: null };

  const allowed = await checkPermission(permission);
  if (!allowed) return { error: "Voce nao tem permissao para executar esta acao.", user: null, admin: null };

  const { supabase: admin, error } = await createAdminClient();
  if (error || !admin) return { error: "Cliente administrativo do Supabase nao configurado.", user: null, admin: null };

  return { error: null, user, admin };
}

export async function listVehicleDocumentsAction(vehicleId: number): Promise<ActionResult<VehicleDocument[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicle_documents")
    .select(documentSelect())
    .eq("vehicle_id", vehicleId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (error) return { success: false, error: error.message };

  return {
    success: true,
    data: ((data ?? []) as unknown as Record<string, unknown>[]).map(mapDocument),
  };
}

export async function uploadVehicleDocumentAction(formData: FormData): Promise<ActionResult<VehicleDocument>> {
  const auth = await requireAdmin("documents:create");
  if (auth.error || !auth.user || !auth.admin) return { success: false, error: auth.error ?? "Nao autorizado." };

  const vehicleId = Number(formData.get("vehicle_id"));
  const categoryIdRaw = formData.get("category_id")?.toString();
  const title = formData.get("title")?.toString().trim();
  const description = formData.get("description")?.toString().trim();
  const expiresAt = formData.get("expires_at")?.toString();
  const file = formData.get("file");

  if (!vehicleId || !title || !(file instanceof File)) {
    return { success: false, error: "Preencha veiculo, titulo e arquivo." };
  }

  const safeName = sanitizeFileName(file.name);
  const filePath = `${vehicleId}/${Date.now()}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await auth.admin.storage.from(BUCKET).upload(filePath, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (uploadError) return { success: false, error: uploadError.message };

  const { data: signed } = await auth.admin.storage.from(BUCKET).createSignedUrl(filePath, 60 * 60);

  const { data, error } = await auth.admin
    .from("vehicle_documents")
    .insert({
      vehicle_id: vehicleId,
      category_id: categoryIdRaw ? Number(categoryIdRaw) : null,
      title,
      description: description || null,
      file_name: file.name,
      file_path: filePath,
      file_url: signed?.signedUrl || filePath,
      file_size: file.size,
      mime_type: file.type || null,
      expires_at: expiresAt || null,
      created_by: auth.user.id,
      updated_by: auth.user.id,
    })
    .select(documentSelect())
    .single();

  if (error) {
    await auth.admin.storage.from(BUCKET).remove([filePath]);
    return { success: false, error: error.message };
  }

  revalidatePath("/veiculos");
  return { success: true, data: mapDocument(data as unknown as Record<string, unknown>) };
}

export async function updateVehicleDocumentAction(
  id: number,
  values: {
    title: string;
    description?: string;
    category_id?: string;
    expires_at?: string;
    active: boolean;
  },
) {
  const auth = await requireAdmin("documents:update");
  if (auth.error || !auth.user || !auth.admin) return { success: false, error: auth.error ?? "Nao autorizado." };

  const { error } = await auth.admin
    .from("vehicle_documents")
    .update({
      title: values.title.trim(),
      description: values.description?.trim() || null,
      category_id: values.category_id ? Number(values.category_id) : null,
      expires_at: values.expires_at || null,
      active: values.active,
      updated_by: auth.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/veiculos");
  return { success: true };
}

export async function deleteVehicleDocumentAction(id: number) {
  const auth = await requireAdmin("documents:delete");
  if (auth.error || !auth.user || !auth.admin) return { success: false, error: auth.error ?? "Nao autorizado." };

  const { data: document, error: fetchError } = await auth.admin
    .from("vehicle_documents")
    .select("file_path")
    .eq("id", id)
    .single();

  if (fetchError) return { success: false, error: fetchError.message };

  const { error } = await auth.admin
    .from("vehicle_documents")
    .update({
      is_deleted: true,
      active: false,
      deleted_at: new Date().toISOString(),
      deleted_by: auth.user.id,
      updated_by: auth.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  if (document?.file_path) {
    await auth.admin.storage.from(BUCKET).remove([document.file_path]);
  }

  revalidatePath("/veiculos");
  return { success: true };
}

export async function getVehicleDocumentUrlAction(id: number): Promise<ActionResult<string>> {
  const auth = await requireAdmin("documents:view");
  if (auth.error || !auth.admin) return { success: false, error: auth.error ?? "Nao autorizado." };

  const { data: document, error } = await auth.admin
    .from("vehicle_documents")
    .select("file_path")
    .eq("id", id)
    .eq("is_deleted", false)
    .single();

  if (error) return { success: false, error: error.message };

  const { data, error: signedError } = await auth.admin.storage
    .from(BUCKET)
    .createSignedUrl(document.file_path, 60 * 10);

  if (signedError) return { success: false, error: signedError.message };
  return { success: true, data: data.signedUrl };
}
