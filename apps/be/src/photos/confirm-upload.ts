import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { getUserId } from './utils';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

/**
 * POST /photos/confirm-upload
 * Confirm successful upload and save photo metadata to DynamoDB
 *
 * Request body:
 * {
 *   "imageId": "uuid",
 *   "imageKey": "photos/user123/uuid.jpg",
 *   "title": "My photo",
 *   "description": "Optional description"
 * }
 *
 * Response:
 * {
 *   "message": "Photo saved successfully",
 *   "photo": { ... }
 * }
 */
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const userId = getUserId(event);
    const body = JSON.parse(event.body || '{}');
    const tableName = process.env.TABLE_NAME;
    const bucketName = process.env.BUCKET_NAME;

    if (!tableName) {
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ message: 'Table name not configured' }),
      };
    }

    // Validate required fields
    if (!body.imageId || !body.imageKey) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          message: 'Missing required fields: imageId, imageKey',
        }),
      };
    }

    // Verify the imageKey belongs to this user
    if (!body.imageKey.startsWith(`photos/${userId}/`)) {
      return {
        statusCode: 403,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({
          message: 'Image key does not belong to authenticated user',
        }),
      };
    }

    const timestamp = new Date().toISOString();

    // Create photo metadata record
    const photo = {
      PK: `USER#${userId}`,
      SK: `IMAGE#${body.imageId}`,
      GSI1PK: `IMAGE#${body.imageId}`,
      entityType: 'IMAGE',
      userId,
      imageId: body.imageId,
      originalS3Key: body.imageKey,
      title: body.title || 'Untitled',
      description: body.description,
      bucketName,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await docClient.send(
      new PutCommand({
        TableName: tableName,
        Item: photo,
      })
    );

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Photo saved successfully',
        photo,
      }),
    };
  } catch (error) {
    console.error('Error saving photo metadata:', error);

    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        message: 'Failed to save photo metadata',
        error: error.message,
      }),
    };
  }
}
