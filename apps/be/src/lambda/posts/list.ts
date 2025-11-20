import type { APIGatewayProxyEvent } from 'aws-lambda';
import {
  getPostsByUser,
  getGlobalFeed,
  getUserLikedPostsFromList,
} from '../../database';
import { getOptionalUserId } from '../utils';
import { createApiHandlerNoBody } from '../middleware/apiHandler';
import { PostDto } from '@chahm/types';

/**
 * GET /posts
 * List posts with optional filters
 *
 * Query parameters:
 * - userId: Filter by user ID
 * - limit: Number of items to return (default: 20)
 * - lastEvaluatedKey: Pagination token (JSON string)
 */
export const handler = createApiHandlerNoBody().handler(
  async (event: APIGatewayProxyEvent) => {
    // Get current user (optional - for checking isLiked)
    const currentUserId = getOptionalUserId(event);

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

    const likedPostIds = await getUserLikedPostsFromList(
      currentUserId,
      result.items.map((post) => post.postId)
    );

    const postsWithLikeStatus: PostDto[] = result.items.map((post) => ({
      ...post,
      isLiked: likedPostIds.has(post.postId),
    }));

    return {
      statusCode: 200,
      body: {
        posts: postsWithLikeStatus,
        count: postsWithLikeStatus.length,
        lastEvaluatedKey: result.lastEvaluatedKey
          ? JSON.stringify(result.lastEvaluatedKey)
          : undefined,
      },
    };
  }
);
