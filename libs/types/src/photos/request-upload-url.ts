import * as zod from 'zod';

const allowedContentTypes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export const requestUploadUrlSchema = zod.object({
  fileName: zod.string().min(1, 'File name is required'),
  contentType: zod.enum(allowedContentTypes, {
    errorMap: () => ({
      message: `Invalid content type. Allowed: ${allowedContentTypes.join(', ')}`,
    }),
  }),
});

export type RequestUploadUrlPayload = zod.infer<typeof requestUploadUrlSchema>;

export interface RequestUploadUrlResponse {
  uploadUrl: string;
  imageKey: string;
  imageUrl: string;
  expiresIn: number;
}
