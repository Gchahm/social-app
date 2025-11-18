import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import { APIGatewayProxyEventSchema } from '@aws-lambda-powertools/parser/schemas/api-gateway';
import httpEventNormalizerMiddleware from '@middy/http-event-normalizer';
import { parser } from '@aws-lambda-powertools/parser/middleware';
import { addCorsHeader, getUserId } from './utils';
import { getContext, PhotosContext } from './context';
import type { APIGatewayProxyResult } from 'aws-lambda';
import { ApiGatewayProxyEventType, DynamoDBItem, Image } from './types';

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
  const { db, tableName } = ctx;
  const userId = getUserId(event);

  if (!userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        message: 'Unauthorized: User ID not found',
      }),
    };
  }

  try {
    const result = await db.query({
      TableName: tableName,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': { S: `USER#${userId}` },
        ':sk': { S: 'IMAGE#' },
      },
    });

    const images: Image[] =
      result.Items?.map(dynamoDBItemToImage).filter(
        (img): img is Image => img !== null
      ) || [];

    const response = {
      statusCode: 200,
      body: JSON.stringify({
        images,
        count: images.length,
      }),
    };

    //TODO: Need to eventually use this in middy
    addCorsHeader(response);

    return response;
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
    };
  } catch (error) {
    console.error('Error parsing DynamoDB item:', error);
    return null;
  }
}
