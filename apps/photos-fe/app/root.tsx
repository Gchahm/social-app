import '@aws-amplify/ui-react/styles.css';
import '@chahm/ui-components/styles/globals.css';

import {
  Links,
  type LinksFunction,
  Meta,
  type MetaFunction,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';
import { Authenticator } from '@aws-amplify/ui-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BEStack } from '../outputs.json';
import { Amplify } from 'aws-amplify';
import { fetchAuthSession } from 'aws-amplify/auth';

export const meta: MetaFunction = () => [
  {
    title: 'New Nx React Router App',
  },
];

export const links: LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

Amplify.configure(
  {
    Auth: {
      Cognito: {
        userPoolId: BEStack.AuthConstructUserPoolIdE22F6EE5,
        userPoolClientId: BEStack.AuthConstructUserPoolClientIdA88338FC,
        loginWith: {
          email: true,
        },
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
        photos: {
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

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Authenticator>
        <Outlet />
      </Authenticator>
    </QueryClientProvider>
  );
}
