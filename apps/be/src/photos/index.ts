import { postHandler } from './post';
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
        break;
      case 'POST':
        response = await postHandler(event as any, context);
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
