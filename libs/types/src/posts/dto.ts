import { z } from 'zod';

export const postDtoSchema = z.object({
  postId: z.string(),
  userId: z.string(),
  imageUrl: z.string(),
  caption: z.string().optional(),
  likeCount: z.number(),
  commentCount: z.number(),
  isLiked: z.boolean(),
  createdAt: z.string(),
});


export type PostDto = z.infer<typeof postDtoSchema>;
