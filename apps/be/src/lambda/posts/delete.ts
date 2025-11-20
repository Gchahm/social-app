import type { APIGatewayProxyEvent } from 'aws-lambda';
import { getPostById, deletePost } from '../../database';
import { incrementPostCount } from '../../database/user';
import { getUserId } from '../utils';
import { createApiHandlerNoBody } from '../middleware/apiHandler';
import * as createHttpError from 'http-errors';

/**
 * DELETE /posts/:postId
 * Delete a post
 */
export const handler = createApiHandlerNoBody().handler(
  async (event: APIGatewayProxyEvent) => {
    const userId = getUserId(event);
    const postId = event.pathParameters?.postId;

    if (!postId) {
      throw new createHttpError.BadRequest('Post ID is required');
    }

    // Check if post exists and user owns it
    const existingPost = await getPostById(postId);
    if (!existingPost) {
      throw new createHttpError.NotFound('Post not found');
    }

    if (existingPost.userId !== userId) {
      throw new createHttpError.Forbidden('You can only delete your own posts');
    }

    // Delete the post
    await deletePost(postId);

    // Decrement user's post count
    await incrementPostCount(userId, -1);

    return {
      statusCode: 200,
      body: {
        message: 'Post deleted successfully',
      },
    };
  }
);
