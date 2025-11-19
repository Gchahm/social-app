import '@chahm/ui-components/styles/globals.css';
import { UploadImageForm } from '../components';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@chahm/ui-components';
import { useCreatePost } from '../hooks';
import { UploadPhotoPayload } from '@chahm/types';

export function Upload() {
  // Hooks for API calls
  const createPostMutation = useCreatePost();

  const handleUpload = async (formData: UploadPhotoPayload) => {
    // Convert base64 to File

    await createPostMutation.mutateAsync(formData);
  };

  return (
    <div className="flex flex-col gap-4 p-4 overflow-auto max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">Upload Photo</h1>

      {!createPostMutation.isSuccess ? (
        // Upload form
        <UploadImageForm onSubmit={handleUpload} />
      ) : (
        // Post-upload options
        <Card>
          <CardHeader>
            <CardTitle>Phost created sucessfully!</CardTitle>
            <CardDescription>Nothing do do here</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Loading state */}
      {createPostMutation.isPending && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <Card className="p-6">
            <p className="text-lg">Uploading photo...</p>
          </Card>
        </div>
      )}
    </div>
  );
}

export default Upload;
