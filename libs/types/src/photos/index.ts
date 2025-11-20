import * as zod from 'zod';

export * from './request-upload-url';

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
