import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { getUserId, successResponse, errorResponse, validateRequiredFields } from './utils';

const s3Client = new S3Client({});
const BUCKET_NAME = process.env.BUCKET_NAME!;

/**
 * POST /posts/upload-url
 * Request a presigned URL for uploading an image directly to S3
 *
 * Request body:
 * {
 *   "fileName": "photo.jpg",
 *   "contentType": "image/jpeg"
 * }
 *
 * Response:
 * {
 *   "uploadUrl": "https://...",
 *   "imageKey": "posts/user123/uuid.jpg",
 *   "imageUrl": "https://bucket.s3.amazonaws.com/posts/user123/uuid.jpg"
 * }
 */
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const userId = getUserId(event);
    const body = JSON.parse(event.body || '{}');

    // Validate required fields
    validateRequiredFields(body, ['fileName', 'contentType']);

    // Validate content type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(body.contentType)) {
      return errorResponse(
        `Invalid content type. Allowed: ${allowedTypes.join(', ')}`,
        400
      );
    }

    // Generate unique file key
    const fileExtension = body.fileName.split('.').pop();
    const imageId = uuidv4();
    const imageKey = `posts/${userId}/${imageId}.${fileExtension}`;

    // Create presigned URL for upload
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: imageKey,
      ContentType: body.contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300, // 5 minutes
    });

    // Construct the final image URL
    const imageUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${imageKey}`;

    return successResponse({
      uploadUrl,
      imageKey,
      imageUrl,
      expiresIn: 300,
    });
  } catch (error) {
    if (error.message === 'User ID not found in request context') {
      return errorResponse('Unauthorized', 401, error);
    }

    if (error.message?.includes('Missing required fields')) {
      return errorResponse(error.message, 400, error);
    }

    return errorResponse('Failed to generate upload URL', 500, error);
  }
}
