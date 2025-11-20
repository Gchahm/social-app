import type { MiddlewareObj } from '@middy/core';

/**
 * Middleware to catch AWS Lambda Powertools ParseError and return proper 400 response
 */
export const parseErrorHandler = (): MiddlewareObj => ({
  onError: async (request) => {
    const { error } = request;

    // Check if it's a ParseError from AWS Lambda Powertools
    if (
      error?.name === 'ParseError' ||
      error?.constructor?.name === 'ParseError'
    ) {
      const validationErrors: any = error.cause || [];

      request.response = {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          message: 'Invalid request data',
          errors: validationErrors.map((err: any) => ({
            field: err.path?.join('.') || 'unknown',
            message: err.message,
            expected: err.expected,
            received: err.received,
          })),
        }),
      };
    }

    return request.response;
  },
});
