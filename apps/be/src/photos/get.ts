import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import { APIGatewayProxyEventSchema } from '@aws-lambda-powertools/parser/schemas/api-gateway';
import httpEventNormalizerMiddleware from '@middy/http-event-normalizer';
import { parser } from '@aws-lambda-powertools/parser/middleware';
import { getContext, PhotosContext } from './context';
import type { APIGatewayProxyResult } from 'aws-lambda';
import { ApiGatewayProxyEventType, DynamoDBItem, Image } from '../types';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { GetPhotosResponse, ImageDto } from '@chahm/types';
const schema = APIGatewayProxyEventSchema;

export const getHandler = middy()
  .use(httpEventNormalizerMiddleware())
  .use(parser({ schema }))
  .use(httpErrorHandler())
  .handler(async (event, context) => {
    const ctx = getContext();
    return getPhotos(event, ctx);
  });

export async function getPhotos(
  event: ApiGatewayProxyEventType,
  ctx: PhotosContext
): Promise<APIGatewayProxyResult> {
  const { db, s3, tableName, bucketName } = ctx;
  // Extract query parameters
  const queryParams = event.queryStringParameters || {};
  const targetUserId = queryParams.userId;
  const skip = parseInt(queryParams.skip || '0', 10);
  const take = parseInt(queryParams.take || '10', 10);

  try {
    const result = targetUserId
      ? await db.query({
          TableName: tableName,
          KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
          ExpressionAttributeValues: {
            ':pk': { S: `USER#${targetUserId}` },
            ':sk': { S: 'IMAGE#' },
          },
        })
      : await db.scan({
          TableName: tableName,
          FilterExpression: 'begins_with(SK, :sk)',
          ExpressionAttributeValues: {
            ':sk': { S: 'IMAGE#' },
          },
        });

    const images: Image[] =
      result.Items?.map(dynamoDBItemToImage).filter(
        (img): img is Image => img !== null
      ) || [];

    // Apply pagination
    const paginatedImages = images.slice(skip, skip + take);

    // Generate pre-signed URLs for each image
    const imagesWithUrls: ImageDto[] = await Promise.all(
      paginatedImages.map(async (image) => {
        try {
          const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: image.originalS3Key,
          });
          const url = await getSignedUrl(s3, command, { expiresIn: 3600 }); // URL expires in 1 hour
          return { ...image, url };
        } catch (error) {
          console.error(
            `Error generating URL for image ${image.imageId}:`,
            error
          );
          return { ...image, url: '' };
        }
      })
    );

    const dto: GetPhotosResponse = {
      images: imagesWithUrls,
      count: imagesWithUrls.length,
      total: images.length,
      skip,
      take,
    };

    return {
      statusCode: 200,
      body: JSON.stringify(dto),
    };
  } catch (error) {
    console.error('Error fetching images from DynamoDB:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: `Error fetching images from DynamoDB ${error.message || ''}`,
      }),
    };
  }
}

function dynamoDBItemToImage(item: DynamoDBItem): Image | null {
  try {
    return {
      userId: item.userId?.S || '',
      imageId: item.imageId?.S || '',
      originalS3Key: item.originalS3Key?.S || '',
      createdAt: item.createdAt?.S || '',
      title: item.title?.S || '',
      description: item.description?.S,
    };
  } catch (error) {
    console.error('Error parsing DynamoDB item:', error);
    return null;
  }
}
