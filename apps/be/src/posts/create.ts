import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { incrementPostCount, createPost } from '../database';
import { errorResponse, getUserId, successResponse } from '../utils';

/**
 * POST /posts
 * Create a new post
 *
 * Request body (Option 1 - Full URL):
 * {
 *   "imageUrl": "https://bucket.s3.amazonaws.com/posts/user123/uuid.jpg",
 *   "caption": "Optional caption"
 * }
 *
 * Request body (Option 2 - S3 Key):
 * {
 *   "imageKey": "posts/user123/uuid.jpg",
 *   "caption": "Optional caption"
 * }
 */
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const userId = getUserId(event);
    const body = JSON.parse(event.body || '{}');

    // Support both imageUrl and imageKey
    let imageUrl: string;

    if (body.imageUrl) {
      imageUrl = body.imageUrl;
    } else if (body.imageKey) {
      // Construct URL from S3 key
      const bucketName = process.env.BUCKET_NAME;
      const region = process.env.AWS_REGION;
      imageUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${body.imageKey}`;
    } else {
      return errorResponse('Either imageUrl or imageKey is required', 400);
    }

    const postId = uuidv4();

    // Create the post
    const post = await createPost({
      postId,
      userId,
      imageUrl,
      caption: body.caption,
    });

    // Increment user's post count
    await incrementPostCount(userId, 1);

    return successResponse(
      {
        message: 'Post created successfully',
        post,
      },
      201
    );
  } catch (error) {
    if (error.message === 'User ID not found in request context') {
      return errorResponse('Unauthorized', 401, error);
    }

    if (error.message?.includes('Missing required fields')) {
      return errorResponse(error.message, 400, error);
    }

    return errorResponse('Failed to create post', 500, error);
  }
}
