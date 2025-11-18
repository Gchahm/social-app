import { APIGatewayProxyResult } from 'aws-lambda';
import { ApiGatewayProxyEventType } from '../types';

export class JsonError extends Error {}

export function addCorsHeader(arg: APIGatewayProxyResult) {
  if (!arg.headers) {
    arg.headers = {};
  }
  arg.headers['Access-Control-Allow-Origin'] = '*';
  arg.headers['Access-Control-Allow-Methods'] = '*';
}

export function getUserId(
  event: Pick<ApiGatewayProxyEventType, 'requestContext'>
): string | undefined {
  return event.requestContext.authorizer['claims']['sub'];
}
