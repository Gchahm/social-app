import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { removeComment, getCommentsByPost } from '../../database';
import { getUserId, successResponse, errorResponse } from '../utils';

/**
 * DELETE /posts/:postId/comments/:commentId
 * Delete a comment
 */
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const userId = getUserId(event);
    const postId = event.pathParameters?.postId;
    const commentId = event.pathParameters?.commentId;

    if (!postId) {
      return errorResponse('Post ID is required', 400);
    }

    if (!commentId) {
      return errorResponse('Comment ID is required', 400);
    }

    // Check if comment exists and user owns it
    const comments = await getCommentsByPost(postId, { limit: 100 });
    const comment = comments.items.find((c) => c.commentId === commentId);

    if (!comment) {
      return errorResponse('Comment not found', 404);
    }

    if (comment.userId !== userId) {
      return errorResponse(
        'Forbidden: You can only delete your own comments',
        403
      );
    }

    // Remove comment (automatically updates comment count)
    await removeComment(postId, commentId);

    return successResponse({
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    if (error.message === 'User ID not found in request context') {
      return errorResponse('Unauthorized', 401, error);
    }

    return errorResponse('Failed to delete comment', 500, error);
  }
}
