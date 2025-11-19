import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { likePost } from '../database';
import { getUserId, successResponse, errorResponse } from '../utils';

/**
 * POST /posts/:postId/like
 * Like a post
 */
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const userId = getUserId(event);
    const postId = event.pathParameters?.postId;

    if (!postId) {
      return errorResponse('Post ID is required', 400);
    }

    // Like the post (automatically updates like count)
    await likePost({ postId, userId });

    return successResponse({
      message: 'Post liked successfully',
    });
  } catch (error) {
    if (error.message === 'User ID not found in request context') {
      return errorResponse('Unauthorized', 401, error);
    }

    if (error.message === 'Post already liked by user') {
      return errorResponse('You have already liked this post', 409, error);
    }

    return errorResponse('Failed to like post', 500, error);
  }
}
