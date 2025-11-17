import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { uploadPhotoSchema } from '@chahm/types';

export async function post(
  event: APIGatewayProxyEvent,
  ddbClient: DynamoDBClient,
  s3Client: S3Client
): Promise<APIGatewayProxyResult> {
  const parsedBody = JSON.parse(event.body);
  const payload = uploadPhotoSchema.parse(parsedBody);

  const bucket = process.env.BUCKET_NAME;
  if (!bucket) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Bucket not configured' }),
    };
  }

  let base64Data = payload.base64;
  let contentType = 'application/octet-stream';
  const dataUrlMatch = /^data:(.*?);base64,(.*)$/.exec(base64Data);
  if (dataUrlMatch) {
    contentType = dataUrlMatch[1] || contentType;
    base64Data = dataUrlMatch[2];
  }

  // Decode base64 to buffer
  const buffer = Buffer.from(base64Data, 'base64');

  // Generate an object key
  const safaName = payload.fileName.replace(/[^a-zA-Z0-9-_]/g, '_');
  const timestamp = Date.now();
  const key = `photos/${safaName}-${timestamp}`;

  let fileExtension = 'jpg';
  if (payload.base64.startsWith('/9j/')) {
    fileExtension = 'jpg';
  } else if (payload.base64.startsWith('iVBORw0KGgo')) {
    fileExtension = 'png';
  } else if (payload.base64.startsWith('R0lGOD')) {
    fileExtension = 'gif';
  } else if (payload.base64) {
    const match = payload.fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    if (match) {
      fileExtension = match[1].toLowerCase();
    }
  }

  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: `image/${fileExtension}`,
    })
  );

  return {
    statusCode: 201,
    body: JSON.stringify({
      // imageId,
      key,
      bucket,
      contentType,
      message: 'Image uploaded and saved successfully',
    }),
  };
}
