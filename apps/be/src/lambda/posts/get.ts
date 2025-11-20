import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getPostById } from '../../database';
import { successResponse, errorResponse } from '../utils';

/**
 * GET /posts/:postId
 * Get a single post by ID
 */
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const postId = event.pathParameters?.postId;

    if (!postId) {
      return errorResponse('Post ID is required', 400);
    }

    const post = await getPostById(postId);

    if (!post) {
      return errorResponse('Post not found', 404);
    }

    return successResponse({ post });
  } catch (error) {
    return errorResponse('Failed to fetch post', 500, error);
  }
}
