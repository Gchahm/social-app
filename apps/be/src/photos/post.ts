import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3 } from '@aws-sdk/client-s3';
import { uploadPhotoSchema } from '@chahm/types';
import { v4 } from 'uuid';
import { DynamoDBItem, Image } from './types';

export async function post(
  event: APIGatewayProxyEvent,
  db: DynamoDB,
  s3: S3
): Promise<APIGatewayProxyResult> {
  const parsedBody = JSON.parse(event.body);
  const payload = uploadPhotoSchema.parse(parsedBody);

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

  return {
    statusCode: 201,
    body: JSON.stringify({
      key: image.originalS3Key,
      contentType,
      message: 'Image uploaded and saved successfully',
    }),
  };
}

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
