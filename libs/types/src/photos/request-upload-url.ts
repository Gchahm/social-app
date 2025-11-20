import { z } from 'zod';

const allowedContentTypes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

export const requestUploadUrlSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  contentType: z.enum(allowedContentTypes, {
    error: () => ({
      message: `Invalid content type. Allowed: ${allowedContentTypes.join(
        ', '
      )}`,
    }),
  }),
});

export type RequestUploadUrlPayload = z.infer<typeof requestUploadUrlSchema>;

export interface RequestUploadUrlResponse {
  uploadUrl: string;
  imageKey: string;
  imageUrl: string;
  expiresIn: number;
}
