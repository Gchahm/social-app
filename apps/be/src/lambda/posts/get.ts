import type { APIGatewayProxyEvent } from 'aws-lambda';
import { getPostById, checkUserLikedPost } from '../../database';
import { getOptionalUserId } from '../utils';
import { createApiHandlerNoBody } from '../middleware/apiHandler';
import * as createHttpError from 'http-errors';

/**
 * GET /posts/:postId
 * Get a single post by ID
 */
export const handler = createApiHandlerNoBody().handler(
  async (event: APIGatewayProxyEvent) => {
    const postId = event.pathParameters?.postId;

    if (!postId) {
      throw new createHttpError.BadRequest('Post ID is required');
    }

    const post = await getPostById(postId);

    if (!post) {
      throw new createHttpError.NotFound('Post not found');
    }

    // Add isLiked field if user is authenticated
    const currentUserId = getOptionalUserId(event);
    let postWithLikeStatus = post;
    if (currentUserId) {
      const isLiked = await checkUserLikedPost(post.postId, currentUserId);
      postWithLikeStatus = { ...post, isLiked };
    }

    return {
      statusCode: 200,
      body: {
        post: postWithLikeStatus,
      },
    };
  }
);
