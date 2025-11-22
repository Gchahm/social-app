import { addCommentSchema } from '@chahm/types';
import { v4 as uuidv4 } from 'uuid';
import { APIGatewayProxyEventSchema } from '@aws-lambda-powertools/parser/schemas/api-gateway';
import { z } from 'zod';
import { addComment } from '../../database';
import { getUserId } from '../utils';
import { createApiHandler } from '../middleware/apiHandler';
import { BadRequest } from 'http-errors';

const AddCommentEventSchema = APIGatewayProxyEventSchema.extend({
  body: addCommentSchema,
});

type AddCommentEventType = z.infer<typeof AddCommentEventSchema>;

/**
 * POST /posts/:postId/comments
 * Add a comment to a post
 */
export const handler = createApiHandler(AddCommentEventSchema).handler(
  async (event: AddCommentEventType) => {
    const userId = getUserId(event);
    const postId = event.pathParameters?.postId;
    const body = event.body;

    if (!postId) {
      throw new BadRequest('Post ID is required');
    }

    const commentId = uuidv4();

    // Add comment (automatically updates comment count)
    await addComment({
      commentId,
      postId,
      userId,
      content: body.content,
    });

    return {
      statusCode: 201,
      body: {
        message: 'Comment added successfully',
        commentId,
      },
    };
  }
);
