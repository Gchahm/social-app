import type { APIGatewayProxyEvent } from 'aws-lambda';
import { getCommentsByPost, getUsersByIds } from '../../database';
import { createApiHandlerNoBody } from '../middleware/apiHandler';
import { BadRequest } from 'http-errors';
import type { CommentDto } from '@chahm/types';

/**
 * GET /posts/:postId/comments
 * Get comments for a post
 *
 * Query parameters:
 * - limit: Number of items to return (default: 20)
 * - lastEvaluatedKey: Pagination token (JSON string)
 */
export const handler = createApiHandlerNoBody().handler(
  async (event: APIGatewayProxyEvent) => {
    const postId = event.pathParameters?.postId;
    const queryParams = event.queryStringParameters || {};
    const limit = parseInt(queryParams.limit || '20', 10);
    const lastEvaluatedKey = queryParams.lastEvaluatedKey
      ? JSON.parse(queryParams.lastEvaluatedKey)
      : undefined;

    if (!postId) {
      throw new BadRequest('Post ID is required');
    }

    const result = await getCommentsByPost(postId, { limit, lastEvaluatedKey });

    // Batch fetch user data for all comment authors
    const userIds = result.items.map((comment) => comment.userId);
    const usersMap = await getUsersByIds(userIds);

    // Map comments with username
    const commentsWithUsername: CommentDto[] = result.items.map((comment) => {
      const user = usersMap.get(comment.userId);
      return {
        ...comment,
        username: user?.username || 'unknown',
      };
    });

    return {
      statusCode: 200,
      body: {
        comments: commentsWithUsername,
        count: commentsWithUsername.length,
        lastEvaluatedKey: result.lastEvaluatedKey
          ? JSON.stringify(result.lastEvaluatedKey)
          : undefined,
      },
    };
  }
);
