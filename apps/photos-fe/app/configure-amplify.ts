import { BEStack } from '../outputs.json';
import { Amplify } from 'aws-amplify';
import { fetchAuthSession } from 'aws-amplify/auth';

export const configureAmplify = () => {
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
            endpoint: BEStack.ApiEndpoint,
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
