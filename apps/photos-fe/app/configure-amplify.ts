import BEStack from '../outputs.json';
import { Amplify } from 'aws-amplify';
import { fetchAuthSession } from 'aws-amplify/auth';

// Determine API endpoint based on environment
const getApiEndpoint = () => {
  // Use localhost in development mode
  if (import.meta.env?.DEV) {
    return 'http://localhost:3000/';
  }

  // Use deployed endpoint in production
  return BEStack.ApiEndpoint;
};

export const configureAmplify = () => {
  const apiEndpoint = getApiEndpoint();

  Amplify.configure(
    {
      Auth: {
        Cognito: {
          userPoolId: BEStack.UserPoolId,
          userPoolClientId: BEStack.UserPoolClientId,
          loginWith: {},
          signUpVerificationMethod: 'code',
          userAttributes: {
            email: {
              required: true,
            },
          },
          passwordFormat: {
            minLength: 8,
            requireLowercase: true,
            requireUppercase: true,
            requireNumbers: true,
            requireSpecialCharacters: true,
          },
        },
      },
      API: {
        REST: {
          SocialApp: {
            endpoint: apiEndpoint,
          },
        },
      },
    },
    {
      API: {
        REST: {
          headers: async () => {
            try {
              const { tokens } = await fetchAuthSession();
              // Use ID Token for user identity claims, Access Token for API access
              const authToken = tokens?.idToken?.toString();
              return {
                Authorization: authToken ? `Bearer ${authToken}` : '',
              };
            } catch (error) {
              console.error('Error fetching auth session:', error);
              return { Authorization: '' }; // Return empty headers on error
            }
          },
        },
      },
    }
  );
};
