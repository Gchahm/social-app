import type { APIGatewayProxyEvent } from 'aws-lambda';
import { likePost } from '../../database';
import { getUserId } from '../utils';
import { createApiHandlerNoBody } from '../middleware/apiHandler';
import { BadRequest, Conflict } from 'http-errors';

/**
 * POST /posts/:postId/like
 * Like a post
 */
export const handler = createApiHandlerNoBody().handler(
  async (event: APIGatewayProxyEvent) => {
    const userId = getUserId(event);
    const postId = event.pathParameters?.postId;

    if (!postId) {
      throw new BadRequest('Post ID is required');
    }

    try {
      // Like the post (automatically updates like count)
      await likePost({ postId, userId });
    } catch (error) {
      if (error.message === 'Post already liked by user') {
        throw new Conflict('You have already liked this post');
      }
      throw error;
    }

    return {
      statusCode: 200,
      body: {
        message: 'Post liked successfully',
      },
    };
  }
);
