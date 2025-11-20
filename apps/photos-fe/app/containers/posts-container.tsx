import { usePosts } from '../hooks';
import { EmptyState, ErrorMessage, Loading, PostsList } from '../components';
import { GetPostsQueryParameters } from '@chahm/types';

export interface PostsContainerProps extends GetPostsQueryParameters {
  title?: string ;
}

export function PostsContainer(props: PostsContainerProps) {
  const { title, ...queryParams } = props;

  const { data, isPending, error, refetch } = usePosts(queryParams);

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
