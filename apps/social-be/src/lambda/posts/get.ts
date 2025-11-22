import type { APIGatewayProxyEvent } from 'aws-lambda';
import { checkUserLikedPost, getPostById } from '../../database';
import { getOptionalUserId } from '../utils';
import { createApiHandlerNoBody } from '../middleware/apiHandler';
import { BadRequest, NotFound } from 'http-errors';
import { PostDto, postDtoSchema } from '@chahm/types';

/**
 * GET /posts/:postId
 * Get a single post by ID
 */
export const handler = createApiHandlerNoBody().handler(
  async (event: APIGatewayProxyEvent) => {
    const postId = event.pathParameters?.postId;

    if (!postId) {
      throw new BadRequest('Post ID is required');
    }

    const post = await getPostById(postId);

    if (!post) {
      throw new NotFound('Post not found');
    }

    // Add isLiked field if user is authenticated
    const currentUserId = getOptionalUserId(event);
    const isLiked =
      !currentUserId || (await checkUserLikedPost(post.postId, currentUserId));

    const postWithLikeStatus: PostDto = postDtoSchema.parse({
      ...post,
      isLiked,
    });

    return {
      statusCode: 200,
      body: {
        post: postWithLikeStatus,
      },
    };
  }
);
