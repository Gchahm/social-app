import '@chahm/ui-components/styles/globals.css';
import '@aws-amplify/ui-react/styles.css';

import {
  Links,
  type LinksFunction,
  Meta,
  type MetaFunction,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureAmplify } from './configure-amplify';

export const meta: MetaFunction = () => [
  {
    title: 'Social Feed - Share Your Moments',
  },
  {
    name: 'description',
    content: 'Share and discover amazing photos with our social photo sharing platform. Upload, view, and engage with photos from users around the world.',
  },
  {
    name: 'keywords',
    content: 'photo sharing, social media, image upload, photo feed, social network',
  },
  {
    property: 'og:title',
    content: 'Social Feed - Share Your Moments',
  },
  {
    property: 'og:description',
    content: 'Share and discover amazing photos with our social photo sharing platform.',
  },
  {
    property: 'og:type',
    content: 'website',
  },
  {
    name: 'twitter:card',
    content: 'summary_large_image',
  },
  {
    name: 'twitter:title',
    content: 'Social Feed - Share Your Moments',
  },
  {
    name: 'twitter:description',
    content: 'Share and discover amazing photos with our social photo sharing platform.',
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
        <meta name="theme-color" content="#ffffff" />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Social Feed" />
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

const queryClient = new QueryClient();
configureAmplify();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
