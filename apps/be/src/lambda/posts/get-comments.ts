import type { APIGatewayProxyEvent } from 'aws-lambda';
import { getCommentsByPost } from '../../database';
import { createApiHandlerNoBody } from '../middleware/apiHandler';
import * as createHttpError from 'http-errors';

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
      throw new createHttpError.BadRequest('Post ID is required');
    }

    const result = await getCommentsByPost(postId, { limit, lastEvaluatedKey });

    return {
      statusCode: 200,
      body: {
        comments: result.items,
        count: result.items.length,
        lastEvaluatedKey: result.lastEvaluatedKey
          ? JSON.stringify(result.lastEvaluatedKey)
          : undefined,
      },
    };
  }
);
