"use server";

import { getVerifiedUser, checkAnyPermission } from "@/utils/permissions";
import { retrySiteEvent } from "@/lib/site-revalidation";

export async function retrySitePublicationAction(eventId: string) {
  const user = await getVerifiedUser();
  if (!user || !await checkAnyPermission(["vehicles:create", "vehicles:update", "vehicles:delete", "banners:create", "banners:update", "banners:delete", "settings:view", "settings:site:update", "sales:create", "sales:update", "finance:create", "finance:update", "finance:delete"])) {
    return { success: false, error: "Sem permissão para repetir a atualização do site." };
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventId)) {
    return { success: false, error: "Publicação inválida." };
  }
  const siteSync = await retrySiteEvent(eventId);
  if (!siteSync) return { success: false, error: "Publicação não encontrada. Verifique a configuração da integração." };
  return { success: true, siteSync };
}
