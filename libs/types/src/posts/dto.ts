import { z } from 'zod';

export const postDtoSchema = z.object({
  postId: z.string(),
  userId: z.string(),
  username: z.string(), // Username of the post creator
  imageUrl: z.string(),
  caption: z.string().optional(),
  likeCount: z.number(),
  commentCount: z.number(),
  isLiked: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});


export type PostDto = z.infer<typeof postDtoSchema>;
