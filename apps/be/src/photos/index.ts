import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { addCorsHeader } from './utils';
import { post } from './post';
import { get } from './get';
import { S3Client } from '@aws-sdk/client-s3';

const ddbClient = new DynamoDBClient({});
const s3Client = new S3Client();

async function handler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  let response: APIGatewayProxyResult;

  try {
    switch (event.httpMethod) {
      case 'GET':
        response = await get(event, ddbClient);
        break;
      case 'POST':
        response = await post(event, ddbClient, s3Client);
        break;
      case 'PUT':
        // const putResponse = await updateSpace(event, ddbClient);
        // response = putResponse;
        break;
      case 'DELETE':
        // const deleteResponse = await deleteSpace(event, ddbClient);
        // response = deleteResponse;
        break;
      default:
        break;
    }
  } catch (error) {
    // if (error instanceof MissingFieldError) {
    //   return {
    //     statusCode: 400,
    //     body: error.message,
    //   };
    // }
    // if (error instanceof JsonError) {
    //   return {
    //     statusCode: 400,
    //     body: error.message,
    //   };
    // }
    return {
      statusCode: 500,
      body: error.message,
    };
  }
  addCorsHeader(response);
  return response;
}

export { handler };
