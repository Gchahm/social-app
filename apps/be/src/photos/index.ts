import {
  APIGatewayEvent,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { addCorsHeader } from './utils';
import { post } from './post';
import { get } from './get';
import { S3 } from '@aws-sdk/client-s3';
import { DynamoDB } from '@aws-sdk/client-dynamodb';

const dynamoDB = new DynamoDB();
const s3 = new S3();

async function handler(
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  let response: APIGatewayProxyResult;
  event.requestContext.authorizer
  event.requestContext.authorizer.claims.email
  try {
    switch (event.httpMethod) {
      case 'GET':
        response = await get(event, dynamoDB);
        break;
      case 'POST':
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
