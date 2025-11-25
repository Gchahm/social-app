import { postDtoSchema } from './dto';
import { z } from 'zod';

export interface GetPostsQueryParameters {
  userId?: string;
  username?: string;
}

export const getPostResponseSchema = z.object({
  posts: z.array(postDtoSchema),
  count: z.number(),
  lastEvaluatedKey: z.string().optional(),
});

export type GetPostsResponse = z.infer<typeof getPostResponseSchema>;
