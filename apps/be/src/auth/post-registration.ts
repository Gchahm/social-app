import { PostConfirmationTriggerHandler } from 'aws-lambda';
import { AttributeValue, DynamoDB } from '@aws-sdk/client-dynamodb';
import { User } from '../types/database';

const dynamoDb: DynamoDB = new DynamoDB();

/**
 * Cognito Post-Registration Lambda Handler
 *
 * This Lambda is triggered automatically after a user confirms their registration in Cognito.
 * Creates a new user entry in DynamoDB with the user's profile information.
 */
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

  try {
    const user: User = {
      userId,
      email,
      name: name || email.split('@')[0], // Use email prefix as fallback if name not provided
      createdAt: new Date().toISOString(),
    };

    await dynamoDb.putItem({
      TableName: tableName,
      Item: userToDynamoDBItem(user),
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

/**
 * Converts a User object to DynamoDB item format
 */
function userToDynamoDBItem(user: User): Record<string, AttributeValue> {
  return {
    PK: { S: `USER#${user.userId}` },
    SK: { S: `PROFILE` },
    GSI1PK: { S: `EMAIL#${user.email}` },
    entityType: { S: 'USER' },
    userId: { S: user.userId },
    email: { S: user.email },
    name: { S: user.name },
    createdAt: { S: user.createdAt },
  };
}
