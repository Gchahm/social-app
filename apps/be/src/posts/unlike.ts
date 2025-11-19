import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { unlikePost } from '../database';
import { getUserId, successResponse, errorResponse } from '../utils';

/**
 * DELETE /posts/:postId/like
 * Unlike a post
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

    // Unlike the post (automatically updates like count)
    await unlikePost(postId, userId);

    return successResponse({
      message: 'Post unliked successfully',
    });
  } catch (error) {
    if (error.message === 'User ID not found in request context') {
      return errorResponse('Unauthorized', 401, error);
    }

    if (error.message === 'Post not liked by user') {
      return errorResponse('You have not liked this post', 409, error);
    }

    return errorResponse('Failed to unlike post', 500, error);
  }
}
