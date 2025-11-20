import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ApiGatewayProxyEventType } from '../../types';
import { BadRequest } from 'http-errors';
import { getLogger } from './context';
export * from './context';

/**
 * Extract user ID from API Gateway event
 * Assumes authentication middleware has set the user ID in requestContext
 * For local development, decodes JWT token directly
 */
export function getUserId(
  event: APIGatewayProxyEvent | Omit<ApiGatewayProxyEventType, 'body'>
): string {
  // Try to get from authorizer context first (production)
  let userId =
    event.requestContext?.authorizer?.['claims']?.sub ||
    event.requestContext?.authorizer?.['userId'];

  // If not found, try to decode JWT from Authorization header (local dev)
  if (!userId) {
    userId = getUserIdFromToken(event);
  }

  // Final fallback for testing
  if (!userId) {
    userId = event.headers?.['x-user-id'];
  }

  if (!userId) {
    throw BadRequest('User ID not found in request context');
  }

  return userId;
}

/**
 * Extract user ID from API Gateway event (optional - returns undefined if not authenticated)
 * Use this for public endpoints that can work with or without authentication
 */
export function getOptionalUserId(
  event: APIGatewayProxyEvent | Omit<ApiGatewayProxyEventType, 'body'>
): string | undefined {
  try {
    return getUserId(event);
  } catch {
    return undefined;
  }
}

function getUserIdFromToken(
  event: APIGatewayProxyEvent | ApiGatewayProxyEventType
): string | undefined {
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
      getLogger().error('Failed to decode JWT token', { error });
      return undefined;
    }
  }
}
