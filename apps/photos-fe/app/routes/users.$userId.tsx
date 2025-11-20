import { PostsContainer } from '../containers';

interface UserFeedProps {
  params: { userId: string };
}

export default function UserFeed({ params }: UserFeedProps) {
  return <PostsContainer userId={params.userId} />;
}
