import { PostConfirmationTriggerHandler } from 'aws-lambda';

/**
 * Cognito Post-Registration Lambda Handler
 * 
 * This Lambda is triggered automatically after a user confirms their registration in Cognito.
 * Use this to perform additional actions like:
 * - Creating user profiles in DynamoDB
 * - Sending welcome emails
 * - Setting up default user data
 * - Adding user to groups
 */
export const handler: PostConfirmationTriggerHandler = async (event) => {
  console.log('Post-registration triggered for user:', event.request.userAttributes);
  
  const { sub: userId, email, name } = event.request.userAttributes;
  
  try {
    // TODO: Add your post-registration logic here
    // Example: Create user profile in DynamoDB
    // Example: Send welcome email
    // Example: Initialize user settings
    
    console.log('Post-registration completed successfully for user:', userId);
    
    // Always return the event for Cognito triggers
    return event;
  } catch (error) {
    console.error('Error in post-registration handler:', error);
    
    // Cognito requires the event to be returned even on error
    // If you throw an error, the user registration will fail
    return event;
  }
};
