import * as zod from 'zod';

export const uploadPhotoSchema = zod.object({
  fileName: zod.string(),
  title: zod.string().min(5),
  description: zod.string().optional(),
  base64: zod.string(),
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
