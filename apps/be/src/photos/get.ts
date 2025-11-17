import * as zod from 'zod';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from '@aws-sdk/client-dynamodb';

const RequestValidator = zod.object({
  id: zod.string(),
});

export async function get(
  event: APIGatewayProxyEvent,
  db: DynamoDB,
): Promise<APIGatewayProxyResult> {
  const parsedRequest = RequestValidator.parse(event.queryStringParameters);

  return {
    statusCode: 201,
    body: JSON.stringify({ id: parsedRequest.id }),
  };
}
