import { DynamoDB } from '@aws-sdk/client-dynamodb';
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
import { addCorsHeader } from './utils';

const dynamoDB = new DynamoDB();
const s3 = new S3();

const schema = APIGatewayProxyEventSchema.extend({
  body: uploadPhotoSchema,
});

export const handler = middy()
  .use(httpEventNormalizerMiddleware())
  .use(httpJsonBodyParserMiddleware())
  .use(parser({ schema }))
  .use(httpErrorHandler())
  .handler(async (event, db) => {
    const payload = event.body;

    console.log('Payload:', payload);

    const imageId = v4();
    const image: Image = {
      userId: 'anonymous',
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

      // await db.putItem({
      //   TableName: process.env.TABLE_NAME,
      //   Item: imageToDynamoDBItem(image),
      // });
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

    const response = {
      statusCode: 201,
      body: JSON.stringify({
        key: image.originalS3Key,
        contentType,
        message: 'Image uploaded and saved successfully',
      }),
    };

    //TODO: Need to eventually use this in middly
    addCorsHeader(response);

    return response;
  });

function getFileExtension(fileName: string): string | undefined {
  const match = fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  if (match) {
    return `image/${match[1].toLowerCase()}`;
  }
}

function imageToDynamoDBItem(image: Image): DynamoDBItem {
  return {
    PK: `USER#${image.userId}`,
    SK: `IMAGE#${image.imageId}`,
    GSI1PK: `IMAGE#${image.imageId}`,
    entityType: 'IMAGE',
    userId: image.userId,
    imageId: image.imageId,
    originalS3Key: image.originalS3Key,
    createdAt: image.createdAt,
  };
}
