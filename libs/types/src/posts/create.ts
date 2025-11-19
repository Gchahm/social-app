import * as zod from 'zod';

export const createPostSchema = zod.object({
  imageKey: zod.string(),
  caption: zod.string().optional(),
});

export type CreatePostPayload = zod.infer<typeof createPostSchema>;

export interface CreatePostResponse {
  message: string;
  post: {
    userId: string;
    postId: string;
    imageKey: string;
    caption?: string;
    createdAt: string;
  };
}
