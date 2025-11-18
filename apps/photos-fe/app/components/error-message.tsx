import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@chahm/ui-components';
import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  error: Error;
  onRetry?: () => void;
}

export function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
  return (
    <div className="flex items-center justify-center p-8">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>Error Loading Photos</CardTitle>
          </div>
          <CardDescription className="text-destructive">
            {error.message}
          </CardDescription>
        </CardHeader>
        {onRetry && (
          <CardContent>
            <Button onClick={onRetry} variant="outline" className="w-full">
              Try Again
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export default ErrorMessage;
