import type { APIGatewayProxyEvent } from 'aws-lambda';
import { removeComment, getCommentsByPost } from '../../database';
import { getUserId } from '../utils';
import { createApiHandlerNoBody } from '../middleware/apiHandler';
import * as createHttpError from 'http-errors';

/**
 * DELETE /posts/:postId/comments/:commentId
 * Delete a comment
 */
export const handler = createApiHandlerNoBody().handler(
  async (event: APIGatewayProxyEvent) => {
    const userId = getUserId(event);
    const postId = event.pathParameters?.postId;
    const commentId = event.pathParameters?.commentId;

    if (!postId) {
      throw new createHttpError.BadRequest('Post ID is required');
    }

    if (!commentId) {
      throw new createHttpError.BadRequest('Comment ID is required');
    }

    // Check if comment exists and user owns it
    const comments = await getCommentsByPost(postId, { limit: 100 });
    const comment = comments.items.find((c) => c.commentId === commentId);

    if (!comment) {
      throw new createHttpError.NotFound('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new createHttpError.Forbidden(
        'You can only delete your own comments'
      );
    }

    // Remove comment (automatically updates comment count)
    await removeComment(postId, commentId);

    return {
      statusCode: 200,
      body: {
        message: 'Comment deleted successfully',
      },
    };
  }
);
