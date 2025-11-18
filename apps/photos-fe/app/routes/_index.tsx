import '@chahm/ui-components/styles/globals.css';
import { EmptyState, ErrorMessage, Loading, PhotosList } from '../components';
import { usePhotos } from '../hooks';

export function _index() {
  const { data, isPending, error, refetch } = usePhotos();

  return (
    <div className="flex flex-col gap-4 p-4 overflow-auto">
      {isPending && <Loading message="Loading photos..." />}

      {error && <ErrorMessage error={error} onRetry={refetch} />}

      {!isPending && !error && data.count === 0 && (
        <EmptyState message="No photos yet. Upload your first photo!" />
      )}

      {!isPending && !error && data && data.count > 0 && (
        <PhotosList data={data} onRefresh={refetch} />
      )}
    </div>
  );
}

export default _index;
