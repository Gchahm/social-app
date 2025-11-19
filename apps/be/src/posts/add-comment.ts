import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { addComment } from '../database';
import { getUserId, successResponse, errorResponse, validateRequiredFields } from '../utils';

/**
 * POST /posts/:postId/comments
 * Add a comment to a post
 *
 * Request body:
 * {
 *   "content": "Comment text"
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

    // Validate required fields
    validateRequiredFields(body, ['content']);

    const commentId = uuidv4();

    // Add comment (automatically updates comment count)
    await addComment({
      commentId,
      postId,
      userId,
      content: body.content,
    });

    return successResponse(
      {
        message: 'Comment added successfully',
        commentId,
      },
      201
    );
  } catch (error) {
    if (error.message === 'User ID not found in request context') {
      return errorResponse('Unauthorized', 401, error);
    }

    if (error.message?.includes('Missing required fields')) {
      return errorResponse(error.message, 400, error);
    }

    return errorResponse('Failed to add comment', 500, error);
  }
}
