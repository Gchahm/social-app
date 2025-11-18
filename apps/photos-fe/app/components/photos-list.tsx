import { Button } from '@chahm/ui-components';
import { GetPhotosResponse } from '../hooks';

interface PhotosListProps {
  data: GetPhotosResponse;
  onRefresh: () => void;
}

export function PhotosList({ data, onRefresh }: PhotosListProps) {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">My Photos ({data.count})</h2>
        <Button onClick={onRefresh} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.images.map((image) => (
          <div
            key={image.imageId}
            className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="aspect-video bg-gray-100 rounded-md mb-3 flex items-center justify-center">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700 truncate">
                {image.originalS3Key}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(image.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              <p className="text-xs text-gray-400 font-mono truncate">
                ID: {image.imageId}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PhotosList;
