import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getPostsByUser, getGlobalFeed } from '../../database';
import { successResponse, errorResponse } from '../utils';
import { getContext } from '../utils/lambda-utils';

/**
 * GET /posts
 * List posts with optional filters
 *
 * Query parameters:
 * - userId: Filter by user ID
 * - limit: Number of items to return (default: 20)
 * - lastEvaluatedKey: Pagination token (JSON string)
 */
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    console.log('list event', getContext());
    const queryParams = event.queryStringParameters || {};
    const userId = queryParams.userId;
    const limit = parseInt(queryParams.limit || '20', 10);
    const lastEvaluatedKey = queryParams.lastEvaluatedKey
      ? JSON.parse(queryParams.lastEvaluatedKey)
      : undefined;

    // Get posts by user or global feed
    const result = userId
      ? await getPostsByUser(userId, { limit, lastEvaluatedKey })
      : await getGlobalFeed({ limit, lastEvaluatedKey });

    return successResponse({
      posts: result.items,
      count: result.items.length,
      lastEvaluatedKey: result.lastEvaluatedKey
        ? JSON.stringify(result.lastEvaluatedKey)
        : undefined,
    });
  } catch (error) {
    return errorResponse('Failed to fetch posts', 500, error);
  }
}
