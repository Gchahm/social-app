import middy from '@middy/core';
import httpEventNormalizerMiddleware from '@middy/http-event-normalizer';
import httpHeaderNormalizerMiddleware from '@middy/http-header-normalizer';
import httpJsonBodyParserMiddleware from '@middy/http-json-body-parser';
import httpCorsMiddleware from '@middy/http-cors';
import httpResponseSerializerMiddleware from '@middy/http-response-serializer';
import httpErrorHandler from '@middy/http-error-handler';
import { parser } from '@aws-lambda-powertools/parser/middleware';
import { parseErrorHandler } from './parseErrorHandler';
import { ZodSchema } from 'zod';
import { Logger } from '@aws-lambda-powertools/logger';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { Metrics } from '@aws-lambda-powertools/metrics';
import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';


const logger = new Logger();
const tracer = new Tracer();
const metrics = new Metrics();

/**
 * Creates a middy handler with standard middleware pipeline for API endpoints
 * @param schema - Zod schema for validating the API Gateway event (including body)
 * @returns Configured middy instance ready to accept a handler function
 */
export const createApiHandler = <T extends ZodSchema>(schema: T) => {
  return middy()
    .use(captureLambdaHandler(tracer))
    .use(injectLambdaContext(logger))
    .use(logMetrics(metrics))
    .use(httpEventNormalizerMiddleware())
    .use(httpHeaderNormalizerMiddleware())
    .use(httpJsonBodyParserMiddleware())
    .use(parser({ schema }))
    .use(
      httpCorsMiddleware({
        origin: '*',
        credentials: false,
      })
    )
    .use(
      httpResponseSerializerMiddleware({
        serializers: [
          {
            regex: /^application\/json$/,
            serializer: ({ body }) => JSON.stringify(body),
          },
        ],
        defaultContentType: 'application/json',
      })
    )
    .use(httpErrorHandler())
    .use(parseErrorHandler());
};

/**
 * Creates a middy handler for API endpoints without body validation
 * Useful for GET, DELETE, or POST endpoints that don't require request body
 * @returns Configured middy instance ready to accept a handler function
 */
export const createApiHandlerNoBody = () => {
  return middy()
    .use(captureLambdaHandler(tracer))
    .use(injectLambdaContext(logger))
    .use(logMetrics(metrics))
    .use(httpEventNormalizerMiddleware())
    .use(httpHeaderNormalizerMiddleware())
    .use(
      httpCorsMiddleware({
        origin: '*',
        credentials: false,
      })
    )
    .use(
      httpResponseSerializerMiddleware({
        serializers: [
          {
            regex: /^application\/json$/,
            serializer: ({ body }) => JSON.stringify(body),
          },
        ],
        defaultContentType: 'application/json',
      })
    )
    .use(httpErrorHandler());
};
