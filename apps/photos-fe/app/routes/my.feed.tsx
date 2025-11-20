import { PostsContainer } from '../containers';
import { useAuthenticator } from '@aws-amplify/ui-react';

export function MyFeed() {
  const { user } = useAuthenticator();

  return <PostsContainer userId={user.userId} />;
}

export default MyFeed;
