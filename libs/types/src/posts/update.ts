import * as zod from 'zod';
import { PostDto } from './dto';

export const updatePostSchema = zod.object({
  caption: zod.string().optional(),
});

export type UpdatePostPayload = zod.infer<typeof updatePostSchema>;

export interface UpdatePostResponse {
  message: string;
  post: PostDto;
}
