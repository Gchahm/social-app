import { PostsContainer } from '../containers';
import { type MetaFunction } from 'react-router';

interface UserFeedProps {
  params: { username: string };
}

export const meta: MetaFunction = ({ params }) => {
  const username = params.username || 'User';
  return [
    {
      title: `${username}'s Photos - Social Feed`,
    },
    {
      name: 'description',
      content: `View photos shared by ${username}. Explore their photo gallery and latest uploads.`,
    },
    {
      property: 'og:title',
      content: `${username}'s Photos - Social Feed`,
    },
    {
      property: 'og:description',
      content: `View photos shared by ${username}.`,
    },
  ];
};

export default function UserFeed({ params }: UserFeedProps) {
  return <PostsContainer username={params.username} />;
}
