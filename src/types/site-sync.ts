export type SiteSyncTopic = "vehicles" | "shorts" | "banners" | "settings";

export type SiteSyncResult = {
  status: "published" | "pending";
  eventId: string;
  retryable?: boolean;
};
