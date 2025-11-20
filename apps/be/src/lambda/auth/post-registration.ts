import { PostConfirmationTriggerHandler } from 'aws-lambda';
import { createUser } from '../../database';
import { getLogger, getMetrics, getTracer } from '../utils';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import { PostConfirmationTriggerEvent } from 'aws-lambda/trigger/cognito-user-pool-trigger/post-confirmation';
import middy from '@middy/core';

const logger = getLogger();

export const handler = middy()
  .use(captureLambdaHandler(getTracer()))
  .use(injectLambdaContext(getLogger()))
  .use(logMetrics(getMetrics()))
  .handler(async (event: PostConfirmationTriggerEvent) => {
    logger.info('Post-registration triggered for user', {
      userAttributes: event.request.userAttributes,
    });

    const { sub: userId, email, name } = event.request.userAttributes;
    const tableName = process.env.TABLE_NAME;

    if (!tableName) {
      logger.error('TABLE_NAME environment variable is not set');
      return event;
    }

    const username = name || email.split('@')[0]; // Use email prefix as fallback if name not provided

    try {
      await createUser({
        userId,
        email,
        username,
        displayName: username,
      });

      logger.info('User profile created successfully in DynamoDB', { userId });

      // Always return the event for Cognito triggers
      return event;
    } catch (error) {
      logger.error('Error creating user profile in DynamoDB', { error });

      // Cognito requires the event to be returned even on error
      // If you throw an error, the user registration will fail
      return event;
    }
  });
