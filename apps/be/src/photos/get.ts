import * as zod from 'zod';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const RequestValidator = zod.object({
  id: zod.string(),
});

export async function get(
  event: APIGatewayProxyEvent,
  ddbClient: DynamoDBClient
): Promise<APIGatewayProxyResult> {
  const parsedRequest = RequestValidator.parse(event.queryStringParameters);

  return {
    statusCode: 201,
    body: JSON.stringify({ id: parsedRequest.id }),
  };
}
