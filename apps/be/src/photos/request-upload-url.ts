import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { getUserId } from './utils';

const s3Client = new S3Client({});

/**
 * POST /photos/upload-url
 * Request a presigned URL for uploading a photo directly to S3
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
 *   "imageKey": "photos/user123/uuid.jpg",
 *   "imageId": "uuid",
 *   "expiresIn": 300
 * }
 */
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const userId = getUserId(event);
    const body = JSON.parse(event.body || '{}');
    const bucketName = process.env.BUCKET_NAME;

    if (!bucketName) {
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ message: 'Bucket name not configured' }),
      };
    }

    // Validate required fields
    if (!body.fileName || !body.contentType) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          message: 'Missing required fields: fileName, contentType',
        }),
      };
    }

    // Validate content type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
    ];
    if (!allowedTypes.includes(body.contentType)) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          message: `Invalid content type. Allowed: ${allowedTypes.join(', ')}`,
        }),
      };
    }

    // Generate unique file key
    const fileExtension = body.fileName.split('.').pop();
    const imageId = uuidv4();
    const imageKey = `photos/${userId}/${imageId}.${fileExtension}`;

    // Create presigned URL for upload
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: imageKey,
      ContentType: body.contentType,
      Metadata: {
        userId,
        originalFileName: body.fileName,
        uploadedAt: new Date().toISOString(),
      },
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300, // 5 minutes
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        uploadUrl,
        imageKey,
        imageId,
        expiresIn: 300,
      }),
    };
  } catch (error) {
    console.error('Error generating upload URL:', error);

    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        message: 'Failed to generate upload URL',
        error: error.message,
      }),
    };
  }
}
