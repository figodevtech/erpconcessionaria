import type { DocumentCategory } from "@/lib/type-catalog";

export type VehicleDocument = {
  id: number;
  vehicle_id: number;
  category_id: number | null;
  title: string;
  description: string | null;
  file_name: string;
  file_path: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  expires_at: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  is_deleted: boolean;
  category?: Pick<DocumentCategory, "id" | "nome"> | null;
};

export function formatFileSize(bytes?: number | null) {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
