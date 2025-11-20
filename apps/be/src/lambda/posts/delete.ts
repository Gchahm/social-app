import type { APIGatewayProxyEvent } from 'aws-lambda';
import { getPostById, deletePost, incrementPostCount } from '../../database';
import { getUserId } from '../utils';
import { createApiHandlerNoBody } from '../middleware/apiHandler';
import { BadRequest, NotFound, Forbidden } from 'http-errors';

/**
 * DELETE /posts/:postId
 * Delete a post
 */
export const handler = createApiHandlerNoBody().handler(
  async (event: APIGatewayProxyEvent) => {
    const userId = getUserId(event);
    const postId = event.pathParameters?.postId;

    if (!postId) {
      throw new BadRequest('Post ID is required');
    }

    // Check if post exists and user owns it
    const existingPost = await getPostById(postId);
    if (!existingPost) {
      throw new NotFound('Post not found');
    }

    if (existingPost.userId !== userId) {
      throw new Forbidden('You can only delete your own posts');
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
