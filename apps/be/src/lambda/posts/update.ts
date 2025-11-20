import { updatePostSchema } from '@chahm/types';
import { APIGatewayProxyEventSchema } from '@aws-lambda-powertools/parser/schemas/api-gateway';
import { z } from 'zod';
import { getPostById, updatePost } from '../../database';
import { getUserId } from '../utils';
import { createApiHandler } from '../middleware/apiHandler';
import { BadRequest, NotFound, Forbidden } from 'http-errors';

const UpdatePostEventSchema = APIGatewayProxyEventSchema.extend({
  body: updatePostSchema,
});

type UpdatePostEventType = z.infer<typeof UpdatePostEventSchema>;

/**
 * PUT /posts/:postId
 * Update a post (caption only)
 */
export const handler = createApiHandler(UpdatePostEventSchema).handler(
  async (event: UpdatePostEventType) => {
    const userId = getUserId(event);
    const postId = event.pathParameters?.postId;
    const body = event.body;

    if (!postId) {
      throw new BadRequest('Post ID is required');
    }

    // Check if post exists and user owns it
    const existingPost = await getPostById(postId);
    if (!existingPost) {
      throw new NotFound('Post not found');
    }

    if (existingPost.userId !== userId) {
      throw new Forbidden('Forbidden: You can only update your own posts');
    }

    // Update the post
    const updatedPost = await updatePost({
      postId,
      caption: body.caption,
    });

    return {
      statusCode: 200,
      body: {
        message: 'Post updated successfully',
        post: updatedPost,
      },
    };
  }
);
