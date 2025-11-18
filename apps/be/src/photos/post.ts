import { uploadPhotoSchema } from '@chahm/types';
import { v4 } from 'uuid';
import { DynamoDBItem, Image } from './types';
import { APIGatewayProxyEventSchema } from '@aws-lambda-powertools/parser/schemas/api-gateway';
import { getUserId } from './utils';
import { getContext, PhotosContext } from './context';
import type { APIGatewayProxyResult } from 'aws-lambda';
import { z } from 'zod';
import middy from '@middy/core';
import httpEventNormalizerMiddleware from '@middy/http-event-normalizer';
import httpJsonBodyParserMiddleware from '@middy/http-json-body-parser';
import { parser } from '@aws-lambda-powertools/parser/middleware';
import httpErrorHandler from '@middy/http-error-handler';

const PostPhotoEventSchema = APIGatewayProxyEventSchema.extend({
  body: uploadPhotoSchema,
});

type PostPhotoEventType = z.infer<typeof PostPhotoEventSchema>;

export const postHandler = middy()
  .use(httpEventNormalizerMiddleware())
  .use(httpJsonBodyParserMiddleware())
  .use(parser({ schema: PostPhotoEventSchema }))
  .use(httpErrorHandler())
  .handler(async (event, context) => {
    const ctx = getContext();
    return uploadPhoto(event, ctx);
  });

export async function uploadPhoto(
  event: PostPhotoEventType,
  ctx: PhotosContext
): Promise<APIGatewayProxyResult> {
  const { db, s3, tableName, bucketName } = ctx;
  const payload = event.body;

  const imageId = v4();
  const image: Image = {
    userId: getUserId(event),
    imageId,
    originalS3Key: `photos/${imageId}`,
    createdAt: new Date().toISOString(),
  };

  const dataUrlMatch = /^data:(.*?);base64,(.*)$/.exec(payload.base64);
  const buffer = Buffer.from(
    dataUrlMatch ? dataUrlMatch[2] : payload.base64,
    'base64'
  );

  const contentType = getFileExtension(payload.fileName);

  try {
    await s3.putObject({
      Bucket: bucketName,
      Key: image.originalS3Key,
      Body: buffer,
      ContentType: contentType,
    });

    await db.putItem({
      TableName: tableName,
      Item: imageToDynamoDBItem(image),
    });

    const response = {
      statusCode: 201,
      body: JSON.stringify({
        imageId: image.imageId,
        key: image.originalS3Key,
        contentType,
        message: 'Image uploaded and saved successfully',
      }),
    };

    return response;
  } catch (error) {
    console.error('Error uploading image to S3 or DynamoDB:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: `Error uploading image to S3 or DynamoDB ${
          error.message || ''
        }`,
      }),
    };
  }
}

function getFileExtension(fileName: string): string | undefined {
  const match = fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  if (match) {
    return `image/${match[1].toLowerCase()}`;
  }
}

function imageToDynamoDBItem(image: Image): DynamoDBItem {
  return {
    PK: { S: `USER#${image.userId}` },
    SK: { S: `IMAGE#${image.imageId}` },
    GSI1PK: { S: `IMAGE#${image.imageId}` },
    entityType: { S: 'IMAGE' },
    userId: { S: image.userId },
    imageId: { S: image.imageId },
    originalS3Key: { S: image.originalS3Key },
    createdAt: { S: image.createdAt },
  };
}
