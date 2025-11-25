import type { APIGatewayProxyEvent } from 'aws-lambda';
import {
  getGlobalFeed,
  getPostsByUser,
  getUserLikedPostsFromList,
  getUsersByIds,
  getUserByUsername,
} from '../../database';
import { getLogger, getOptionalUserId } from '../utils';
import { createApiHandlerNoBody } from '../middleware/apiHandler';
import { PostDto, postDtoSchema } from '@chahm/types';

/**
 * GET /posts
 * List posts with optional filters
 *
 * Query parameters:
 * - userId: Filter by user ID
 * - username: Filter by username (takes precedence over userId)
 * - limit: Number of items to return (default: 20)
 * - lastEvaluatedKey: Pagination token (JSON string)
 */
export const handler = createApiHandlerNoBody().handler(
  async (event: APIGatewayProxyEvent, context) => {
    getLogger().info('context', JSON.stringify(context));
    // Get current user (optional - for checking isLiked)
    const currentUserId = getOptionalUserId(event);

    const queryParams = event.queryStringParameters || {};
    const limit = parseInt(queryParams.limit || '20', 10);
    const lastEvaluatedKey = queryParams.lastEvaluatedKey
      ? JSON.parse(queryParams.lastEvaluatedKey)
      : undefined;

    // Resolve userId from username if provided
    let userId = queryParams.userId;
    if (queryParams.username) {
      const user = await getUserByUsername(queryParams.username);
      if (!user) {
        return {
          statusCode: 404,
          body: {
            error: 'User not found',
            message: `No user found with username: ${queryParams.username}`,
          },
        };
      }
      userId = user.userId;
    }

    // Get posts by user or global feed
    const result = userId
      ? await getPostsByUser(userId, { limit, lastEvaluatedKey })
      : await getGlobalFeed({ limit, lastEvaluatedKey });

    // Batch fetch user data for all post creators
    const userIds = result.items.map((post) => post.userId);
    const usersMap = await getUsersByIds(userIds);

    // Batch check likes if user is authenticated
    let likedPostIds = new Set<string>();
    if (currentUserId && result.items.length > 0) {
      likedPostIds = await getUserLikedPostsFromList(
        currentUserId,
        result.items.map((post) => post.postId)
      );
    }

    // Map posts with username and isLiked
    const postsWithLikeStatus: PostDto[] = result.items.map((post) => {
      const user = usersMap.get(post.userId);
      return postDtoSchema.parse({
        ...post,
        username: user?.username || 'unknown',
        isLiked: likedPostIds.has(post.postId),
      });
    });

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
