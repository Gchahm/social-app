import type { APIGatewayProxyEvent } from 'aws-lambda';
import { unlikePost } from '../../database';
import { getUserId } from '../utils';
import { createApiHandlerNoBody } from '../middleware/apiHandler';
import { BadRequest, Conflict } from 'http-errors';

/**
 * DELETE /posts/:postId/like
 * Unlike a post
 */
export const handler = createApiHandlerNoBody().handler(
  async (event: APIGatewayProxyEvent) => {
    const userId = getUserId(event);
    const postId = event.pathParameters?.postId;

    if (!postId) {
      throw new BadRequest('Post ID is required');
    }

    try {
      // Unlike the post (automatically updates like count)
      await unlikePost(postId, userId);
    } catch (error) {
      if (error.message === 'Post not liked by user') {
        throw new Conflict('You have not liked this post');
      }
      throw error;
    }

    return {
      statusCode: 200,
      body: {
        message: 'Post unliked successfully',
      },
    };
  }
);
