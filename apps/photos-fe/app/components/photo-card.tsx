import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
} from '@chahm/ui-components';
import { ImageDto } from '@chahm/types';
import { ImageIcon, Calendar, Hash } from 'lucide-react';

interface PhotoCardProps {
  image: ImageDto;
}

export function PhotoCard({ image }: PhotoCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="aspect-video bg-muted rounded-md mb-3 flex items-center justify-center overflow-hidden">
          {image.url ? (
            <img
              src={image.url}
              alt={image.originalS3Key.split('/').pop() || 'Photo'}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="w-12 h-12 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <CardTitle className="text-base truncate">
            {image.title}
          </CardTitle>
          {image.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {image.description}
            </p>
          )}
        </div>
        <Separator />
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date(image.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Hash className="h-4 w-4" />
            <span className="font-mono text-xs truncate">
              {image.imageId}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default PhotoCard;
