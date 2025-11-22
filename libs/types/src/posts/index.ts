import { PostDto } from './dto';
import { commentDtoSchema } from './add-comment';
import { z } from 'zod';

export * from './create';
export * from './add-comment';
export * from './update';
export * from './dto';
export * from './getPost';


export interface GetPostResponse {
  post: PostDto;
}

export const getCommentsResponseSchema = z.object({
  comments: z.array(commentDtoSchema),
  count: z.number(),
  lastEvaluatedKey: z.string().optional(),
});

export type GetCommentsResponse = z.infer<typeof getCommentsResponseSchema>;

export interface DeleteCommentResponse {
  message: string;
}

export interface DeletePostResponse {
  message: string;
}
