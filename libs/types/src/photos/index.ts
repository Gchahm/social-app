import * as zod from 'zod';

export const uploadPhotoSchema = zod.object({
  file: zod.file(),
  description: zod.string().optional(),
});

export type UploadPhotoPayload = zod.infer<typeof uploadPhotoSchema>;

export interface UploadPhotoResponse {
  imageId: string;
  key: string;
  bucket: string;
  contentType: string;
}

export interface ImageDto {
  userId: string;
  imageId: string;
  originalS3Key: string;
  createdAt: string;
  title: string;
  description?: string;
  url?: string;
}

export type GetPhotosResponse = {
  images: ImageDto[];
  count: number;
  total: number;
  skip: number;
  take: number;
};

// Presigned URL upload flow types
export interface RequestUploadUrlPayload {
  fileName: string;
  contentType: string;
}

export interface RequestUploadUrlResponse {
  uploadUrl: string;
  imageKey: string;
  imageId: string;
  expiresIn: number;
}

export interface ConfirmUploadPayload {
  imageId: string;
  imageKey: string;
  title: string;
  description?: string;
}

export interface ConfirmUploadResponse {
  message: string;
  photo: ImageDto;
}

