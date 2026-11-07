"use client";

import { toast } from "sonner";
import { retrySitePublicationAction } from "@/actions/site-sync";
import type { SiteSyncResult } from "@/types/site-sync";

type FeedbackOptions = { id?: string | number; description?: string };

export function getSiteSync(result: unknown): SiteSyncResult | undefined {
  if (!result || typeof result !== "object" || !("siteSync" in result)) return;
  const value = result.siteSync;
  if (!value || typeof value !== "object" || !("status" in value) || !("eventId" in value)) return;
  if ((value.status === "pending" || value.status === "published") && typeof value.eventId === "string") {
    return value as SiteSyncResult;
  }
}

export function notifySiteMutation(result: unknown, message: string, options?: FeedbackOptions) {
  const siteSync = getSiteSync(result);
  if (siteSync?.status !== "pending") {
    toast.success(message, { ...options, description: siteSync ? "Atualização do site confirmada." : options?.description });
    return;
  }

  toast.warning("Salvo no painel; atualização do site pendente", {
    ...options,
    id: options?.id ?? siteSync.eventId,
    duration: Infinity,
    description: siteSync.retryable === false
      ? "Seus dados foram salvos. A publicação precisa ser verificada: o serviço de atualização está indisponível."
      : "Seus dados foram salvos. Repita somente a atualização do site.",
    action: siteSync.retryable === false ? undefined : {
      label: "Repetir publicação",
      onClick: async () => {
        try {
          const retry = await retrySitePublicationAction(siteSync.eventId);
          if (!retry.success) {
            toast.error(retry.error || "Não foi possível repetir a publicação.");
            notifySiteMutation({ siteSync }, message);
            return;
          }
          notifySiteMutation(retry, "Atualização do site confirmada.");
        } catch {
          toast.error("Não foi possível confirmar a publicação. Tente novamente.");
          notifySiteMutation({ siteSync }, message);
        }
      },
    },
  });
}

/** Report a partial failure without hiding a pending publication of saved changes. */
export function notifyPendingSiteMutation(result: unknown) {
  if (getSiteSync(result)?.status === "pending") notifySiteMutation(result, "Alterações salvas.");
}
