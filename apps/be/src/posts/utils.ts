import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

/**
 * Extract user ID from API Gateway event
 * Assumes authentication middleware has set the user ID in requestContext
 */
export function getUserId(event: APIGatewayProxyEvent): string {
  // Try to get from authorizer context first
  const userId =
    event.requestContext?.authorizer?.claims?.sub ||
    event.requestContext?.authorizer?.userId ||
    event.headers?.['x-user-id'];

  if (!userId) {
    throw new Error('User ID not found in request context');
  }

  return userId;
}

/**
 * Create a success response
 */
export function successResponse(
  data: any,
  statusCode: number = 200
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(data),
  };
}

/**
 * Create an error response
 */
export function errorResponse(
  message: string,
  statusCode: number = 500,
  error?: any
): APIGatewayProxyResult {
  console.error('Error:', message, error);
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      message,
      error: error?.message || error,
    }),
  };
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(
  body: any,
  requiredFields: string[]
): void {
  const missingFields = requiredFields.filter((field) => !body[field]);
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
}
