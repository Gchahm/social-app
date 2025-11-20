import '@chahm/ui-components/styles/globals.css';
import { EmptyState, ErrorMessage, Loading, PostsList } from '../components';
import { usePosts } from '../hooks';

export default function Index() {
  const { data, isPending, error, refetch } = usePosts();

  return (
    <div className="flex flex-col gap-4 p-4 overflow-auto">
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
