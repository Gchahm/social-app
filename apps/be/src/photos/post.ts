import { AttributeValue, DynamoDB } from '@aws-sdk/client-dynamodb';
import { S3 } from '@aws-sdk/client-s3';
import { uploadPhotoSchema } from '@chahm/types';
import { v4 } from 'uuid';
import { DynamoDBItem, Image } from './types';
import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import { APIGatewayProxyEventSchema } from '@aws-lambda-powertools/parser/schemas/api-gateway';
import httpJsonBodyParserMiddleware from '@middy/http-json-body-parser';
import httpEventNormalizerMiddleware from '@middy/http-event-normalizer';
import { parser } from '@aws-lambda-powertools/parser/middleware';
import { addCorsHeader, getUserId } from './utils';

const db = new DynamoDB();
const s3 = new S3();

const schema = APIGatewayProxyEventSchema.extend({
  body: uploadPhotoSchema,
});

export const handler = middy()
  .use(httpEventNormalizerMiddleware())
  .use(httpJsonBodyParserMiddleware())
  .use(parser({ schema }))
  .use(httpErrorHandler())
  .handler(async (event, context) => {
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
        Bucket: process.env.BUCKET_NAME,
        Key: image.originalS3Key,
        Body: buffer,
        ContentType: contentType,
      });

      await db.putItem({
        TableName: process.env.TABLE_NAME,
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

      //TODO: Need to eventually use this in middly
      addCorsHeader(response);

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
  });

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
