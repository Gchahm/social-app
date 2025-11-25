import { PostsContainer } from '../containers';
import { type MetaFunction } from 'react-router';

export const meta: MetaFunction = () => [
  {
    title: 'Explore Photos - Social Feed',
  },
  {
    name: 'description',
    content: 'Explore and discover amazing photos shared by users from around the world. Browse the latest uploads and trending content.',
  },
  {
    property: 'og:title',
    content: 'Explore Photos - Social Feed',
  },
  {
    property: 'og:description',
    content: 'Explore and discover amazing photos shared by users from around the world.',
  },
];

export default function Index() {
  return <PostsContainer />;
}
