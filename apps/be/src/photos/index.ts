import { postHandler } from './post';
import { getHandler } from './get';
import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { addCorsHeader } from './utils';

async function handler(
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  let response: APIGatewayProxyResult;

  try {
    switch (event.httpMethod) {
      case 'GET':
        response = await getHandler(event as any, context);
        break;
      case 'POST':
        response = await postHandler(event as any, context);
        break;
      default:
        break;
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: error.message,
    };
  }
  addCorsHeader(response);
  return response;
}

export { handler };
