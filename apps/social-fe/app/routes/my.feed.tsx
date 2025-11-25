import { PostsContainer } from '../containers';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { type MetaFunction } from 'react-router';

export const meta: MetaFunction = () => [
  {
    title: 'My Feed - Social Feed',
  },
  {
    name: 'description',
    content: 'View and manage your personal photo feed. See all the photos you have shared.',
  },
  {
    property: 'og:title',
    content: 'My Feed - Social Feed',
  },
  {
    property: 'og:description',
    content: 'View and manage your personal photo feed.',
  },
];

export function MyFeed() {
  const { user } = useAuthenticator();

  return <PostsContainer userId={user.userId} />;
}

export default MyFeed;
