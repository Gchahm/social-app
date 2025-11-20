import { Button, Badge } from '@chahm/ui-components';
import { GetPostsResponse } from '@chahm/types';
import { PostCard } from './post-card';

interface PostsListProps {
  data: GetPostsResponse;
  onRefresh: () => void;
}

export function PostsList({ data, onRefresh }: PostsListProps) {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold">Posts</h2>
          <Badge variant="secondary">{data.count}</Badge>
        </div>
        <Button onClick={onRefresh} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {data.posts.map((post) => (
          <PostCard key={post.postId} post={post} />
        ))}
      </div>
    </div>
  );
}

export default PostsList;
