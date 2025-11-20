import { usePosts } from '../hooks';
import { EmptyState, ErrorMessage, Loading, PostsList } from '../components';

export function PostsContainer() {
  const { data, isPending, error, refetch } = usePosts();

  return (
    <div className="flex flex-col gap-4 p-4 w-full">
      {isPending && <Loading message="Loading posts..." />}

      {error && <ErrorMessage error={error} onRetry={refetch} />}

      {!isPending && !error && data.count === 0 && (
        <EmptyState message="No posts yet. Create your first post!" />
      )}

      {!isPending && !error && data && data.count > 0 && (
        <PostsList data={data} onRefresh={refetch} />
      )}
    </div>
  );
}
