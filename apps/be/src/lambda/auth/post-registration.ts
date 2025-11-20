import { PostConfirmationTriggerHandler } from 'aws-lambda';
import { createUser } from '../../database';

export const handler: PostConfirmationTriggerHandler = async (event) => {
  console.log(
    'Post-registration triggered for user:',
    event.request.userAttributes
  );

  const { sub: userId, email, name } = event.request.userAttributes;
  const tableName = process.env.TABLE_NAME;

  if (!tableName) {
    console.error('TABLE_NAME environment variable is not set');
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

    console.log('User profile created successfully in DynamoDB:', userId);

    // Always return the event for Cognito triggers
    return event;
  } catch (error) {
    console.error('Error creating user profile in DynamoDB:', error);

    // Cognito requires the event to be returned even on error
    // If you throw an error, the user registration will fail
    return event;
  }
};
