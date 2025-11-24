import { PostsContainer } from '../containers';
import { type MetaFunction } from 'react-router';

interface UserFeedProps {
  params: { userId: string };
}

export const meta: MetaFunction<typeof loader> = ({ params }) => {
  const userId = params.userId || 'User';
  return [
    {
      title: `${userId}'s Photos - Social Feed`,
    },
    {
      name: 'description',
      content: `View photos shared by ${userId}. Explore their photo gallery and latest uploads.`,
    },
    {
      property: 'og:title',
      content: `${userId}'s Photos - Social Feed`,
    },
    {
      property: 'og:description',
      content: `View photos shared by ${userId}.`,
    },
  ];
};

export async function loader({ params }: { params: { userId: string } }) {
  return { userId: params.userId };
}

export default function UserFeed({ params }: UserFeedProps) {
  return <PostsContainer userId={params.userId} />;
}
