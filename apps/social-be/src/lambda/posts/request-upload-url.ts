import { requestUploadUrlSchema } from '@chahm/types';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { APIGatewayProxyEventSchema } from '@aws-lambda-powertools/parser/schemas/api-gateway';
import { z } from 'zod';
import { getContext, getUserId } from '../utils';
import { createApiHandler } from '../middleware/apiHandler';

const s3Client = new S3Client({});
const { bucketName } = getContext();

const RequestUploadUrlEventSchema = APIGatewayProxyEventSchema.extend({
  body: requestUploadUrlSchema,
});

type RequestUploadUrlEventType = z.infer<typeof RequestUploadUrlEventSchema>;

/**
 * POST /posts/upload-url
 * Request a presigned URL for uploading an image directly to S3
 */
export const handler = createApiHandler(RequestUploadUrlEventSchema).handler(
  async (event: RequestUploadUrlEventType) => {
    const userId = getUserId(event);
    const body = event.body;

    // Generate unique file key
    const fileExtension = body.fileName.split('.').pop();
    const imageId = uuidv4();
    const imageKey = `posts/${userId}/${imageId}.${fileExtension}`;

    // Create presigned URL for upload
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: imageKey,
      ContentType: body.contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300, // 5 minutes
    });

    // Construct the final image URL
    const imageUrl = `https://${bucketName}.s3.${
      process.env.AWS_REGION || 'us-east-1'
    }.amazonaws.com/${imageKey}`;

    return {
      statusCode: 200,
      body: {
        uploadUrl,
        imageKey,
        imageUrl,
        expiresIn: 300,
      },
    };
  }
);
