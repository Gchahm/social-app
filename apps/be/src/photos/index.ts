import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { addCorsHeader } from './utils';
import { JsonError, MissingFieldError } from './validator';
import { postSpaces } from './post-spaces';

const ddbClient = new DynamoDBClient({});

async function handler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  let response: APIGatewayProxyResult;

  try {
    switch (event.httpMethod) {
      case 'GET':
        // const getResponse = await getSpaces(event, ddbClient);
        // response = getResponse;
        break;
      case 'POST':
        response = await postSpaces(event, ddbClient);
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
    if (error instanceof MissingFieldError) {
      return {
        statusCode: 400,
        body: error.message,
      };
    }
    if (error instanceof JsonError) {
      return {
        statusCode: 400,
        body: error.message,
      };
    }
    return {
      statusCode: 500,
      body: error.message,
    };
  }
  addCorsHeader(response);
  return response;
}

export { handler };
