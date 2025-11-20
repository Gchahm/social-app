import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getPostById, deletePost } from '../../database';
import { incrementPostCount } from '../../database/user';
import { getUserId, successResponse, errorResponse } from '../utils';

/**
 * DELETE /posts/:postId
 * Delete a post
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

    // Check if post exists and user owns it
    const existingPost = await getPostById(postId);
    if (!existingPost) {
      return errorResponse('Post not found', 404);
    }

    if (existingPost.userId !== userId) {
      return errorResponse('Forbidden: You can only delete your own posts', 403);
    }

    // Delete the post
    await deletePost(postId);

    // Decrement user's post count
    await incrementPostCount(userId, -1);

    return successResponse({
      message: 'Post deleted successfully',
    });
  } catch (error) {
    if (error.message === 'User ID not found in request context') {
      return errorResponse('Unauthorized', 401, error);
    }

    return errorResponse('Failed to delete post', 500, error);
  }
}
