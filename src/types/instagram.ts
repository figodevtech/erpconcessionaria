export interface InstagramMediaImage {
  id: string;
  media_url: string;
  permalink?: string;
  thumbnail_url?: string;
}

export interface InstagramMediaResponse {
  images: InstagramMediaImage[];
}

export interface InstagramImportedImage {
  originalId: string;
  path: string;
  publicUrl: string;
  vehicleImage?: unknown;
}

export interface InstagramImportResponse {
  success: boolean;
  imported: InstagramImportedImage[];
}
