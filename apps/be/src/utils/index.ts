import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

/**
 * Extract user ID from API Gateway event
 * Assumes authentication middleware has set the user ID in requestContext
 * For local development, decodes JWT token directly
 */
export function getUserId(event: APIGatewayProxyEvent): string {
  // Try to get from authorizer context first (production)
  let userId =
    event.requestContext?.authorizer?.claims?.sub ||
    event.requestContext?.authorizer?.userId;

  // If not found, try to decode JWT from Authorization header (local dev)
  if (!userId) {
    userId = getUserIdFromToken(event);
  }

  // Final fallback for testing
  if (!userId) {
    userId = event.headers?.['x-user-id'];
  }

  if (!userId) {
    throw new Error('User ID not found in request context');
  }

  return userId;
}

function getUserIdFromToken(event: APIGatewayProxyEvent): string | undefined {
  const authHeader =
    event.headers?.Authorization || event.headers?.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      // Decode JWT without verification (local dev only - authorizer validates in prod)
      const base64Payload = token.split('.')[1];
      const payload = JSON.parse(
        Buffer.from(base64Payload, 'base64').toString()
      );
      return payload.sub;
    } catch (error) {
      return undefined;
      console.error('Failed to decode JWT token:', error);
    }
  }
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
