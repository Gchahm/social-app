import { APIGatewayProxyHandler } from 'aws-lambda';

/**
 * Health check endpoint
 * Returns 200 OK with basic system information
 */
export const handler: APIGatewayProxyHandler = async () => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: process.env.SERVICE_NAME || 'backend',
      environment: process.env.ENVIRONMENT || 'unknown',
    }),
  };
};