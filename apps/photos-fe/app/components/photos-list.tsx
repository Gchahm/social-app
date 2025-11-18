import { Button, Badge } from '@chahm/ui-components';
import { GetPhotosResponse } from '../hooks';
import { PhotoCard } from './photo-card';

interface PhotosListProps {
  data: GetPhotosResponse;
  onRefresh: () => void;
}

export function PhotosList({ data, onRefresh }: PhotosListProps) {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold">My Photos</h2>
          <Badge variant="secondary">{data.count}</Badge>
        </div>
        <Button onClick={onRefresh} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.images.map((image) => (
          <PhotoCard key={image.imageId} image={image} />
        ))}
      </div>
    </div>
  );
}

export default PhotosList;
