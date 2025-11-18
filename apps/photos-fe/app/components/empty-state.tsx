interface EmptyStateProps {
  message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center p-8">
      <p className="text-gray-600">{message}</p>
    </div>
  );
}

export default EmptyState;
