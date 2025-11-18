import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@chahm/ui-components';
import { ImageOff } from 'lucide-react';

interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center p-8">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-muted p-6">
              <ImageOff className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>
          <CardTitle>No Photos Yet</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

export default EmptyState;
