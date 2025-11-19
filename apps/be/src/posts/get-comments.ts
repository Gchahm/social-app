import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getCommentsByPost } from '../database';
import { successResponse, errorResponse } from './utils';

/**
 * GET /posts/:postId/comments
 * Get comments for a post
 *
 * Query parameters:
 * - limit: Number of items to return (default: 20)
 * - lastEvaluatedKey: Pagination token (JSON string)
 */
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const postId = event.pathParameters?.postId;
    const queryParams = event.queryStringParameters || {};
    const limit = parseInt(queryParams.limit || '20', 10);
    const lastEvaluatedKey = queryParams.lastEvaluatedKey
      ? JSON.parse(queryParams.lastEvaluatedKey)
      : undefined;

    if (!postId) {
      return errorResponse('Post ID is required', 400);
    }

    const result = await getCommentsByPost(postId, { limit, lastEvaluatedKey });

    return successResponse({
      comments: result.items,
      count: result.items.length,
      lastEvaluatedKey: result.lastEvaluatedKey
        ? JSON.stringify(result.lastEvaluatedKey)
        : undefined,
    });
  } catch (error) {
    return errorResponse('Failed to fetch comments', 500, error);
  }
}
