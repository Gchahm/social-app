import * as zod from 'zod';

export const addCommentSchema = zod.object({
  content: zod.string().min(1, 'Comment content is required'),
});

export type AddCommentPayload = zod.infer<typeof addCommentSchema>;

export const commentDtoSchema = zod.object({
  commentId: zod.string(),
  postId: zod.string(),
  userId: zod.string(),
  username: zod.string(),
  content: zod.string(),
  createdAt: zod.string(),
  updatedAt: zod.string().optional(),
});

export type CommentDto = zod.infer<typeof commentDtoSchema>;

export const addCommentResponseSchema = zod.object({
  message: zod.string(),
  commentId: zod.string(),
});

export type AddCommentResponse = zod.infer<typeof addCommentResponseSchema>;
