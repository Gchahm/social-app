import * as zod from 'zod';

export const updatePostSchema = zod.object({
  caption: zod.string().optional(),
});

export type UpdatePostPayload = zod.infer<typeof updatePostSchema>;

export interface PostDto {
  postId: string;
  userId: string;
  imageUrl: string;
  caption?: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePostResponse {
  message: string;
  post: PostDto;
}