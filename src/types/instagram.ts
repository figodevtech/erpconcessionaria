export interface InstagramMediaImage {
  id: string;
  media_url: string;
  permalink?: string;
  thumbnail_url?: string;
  url?: string;
  index?: number;
  width?: number;
  height?: number;
}

export interface InstagramMediaResponse {
  images: InstagramMediaImage[];
}

export interface InstagramExtractedImage {
  id: string;
  url: string;
  index: number;
  width?: number;
  height?: number;
}

export interface InstagramExtractResponse {
  success: boolean;
  postShortcode: string;
  images: InstagramExtractedImage[];
}

export interface InstagramImportedImage {
  originalId: string;
  path: string;
  publicUrl: string;
  vehicleImage?: unknown;
}

export interface InstagramImportedFile {
  path: string;
  publicUrl: string;
  vehicleImage?: unknown;
}

export interface InstagramImportResponse {
  success: boolean;
  imported: InstagramImportedImage[];
  files?: InstagramImportedFile[];
}
