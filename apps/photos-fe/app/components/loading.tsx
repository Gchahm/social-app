interface LoadingProps {
  message?: string;
}

export function Loading({ message = 'Loading...' }: LoadingProps) {
  return (
    <div className="flex items-center justify-center p-8">
      <p className="text-gray-600">{message}</p>
    </div>
  );
}

export default Loading;
