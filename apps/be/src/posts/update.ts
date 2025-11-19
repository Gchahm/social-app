import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getPostById, updatePost } from '../database';
import { getUserId, successResponse, errorResponse } from '../utils';

/**
 * PUT /posts/:postId
 * Update a post (caption only)
 *
 * Request body:
 * {
 *   "caption": "New caption"
 * }
 */
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const userId = getUserId(event);
    const postId = event.pathParameters?.postId;
    const body = JSON.parse(event.body || '{}');

    if (!postId) {
      return errorResponse('Post ID is required', 400);
    }

    // Check if post exists and user owns it
    const existingPost = await getPostById(postId);
    if (!existingPost) {
      return errorResponse('Post not found', 404);
    }

    if (existingPost.userId !== userId) {
      return errorResponse('Forbidden: You can only update your own posts', 403);
    }

    // Update the post
    const updatedPost = await updatePost({
      postId,
      caption: body.caption,
    });

    return successResponse({
      message: 'Post updated successfully',
      post: updatedPost,
    });
  } catch (error) {
    if (error.message === 'User ID not found in request context') {
      return errorResponse('Unauthorized', 401, error);
    }

    return errorResponse('Failed to update post', 500, error);
  }
}
