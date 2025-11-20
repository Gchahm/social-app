import * as zod from 'zod';

export const addCommentSchema = zod.object({
  content: zod.string().min(1, 'Comment content is required'),
});

export type AddCommentPayload = zod.infer<typeof addCommentSchema>;

export interface CommentDto {
  commentId: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddCommentResponse {
  message: string;
  comment: CommentDto;
}
