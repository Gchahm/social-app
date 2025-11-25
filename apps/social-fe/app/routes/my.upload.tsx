import { UploadImageForm } from '../components';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@chahm/ui-components';
import { useCreatePost } from '../hooks';
import { UploadPhotoPayload } from '@chahm/types';
import { useNavigate, type MetaFunction } from 'react-router';

export const meta: MetaFunction = () => [
  {
    title: 'Upload Photo - Social Feed',
  },
  {
    name: 'description',
    content: 'Upload and share your photos with the community. Add descriptions and share your moments.',
  },
  {
    property: 'og:title',
    content: 'Upload Photo - Social Feed',
  },
  {
    property: 'og:description',
    content: 'Upload and share your photos with the community.',
  },
];

export function MyFeed() {
  // Hooks for API calls
  const createPostMutation = useCreatePost();
  const navigate = useNavigate();

  const handleUpload = async (formData: UploadPhotoPayload) => {
    // Convert base64 to File

    await createPostMutation.mutateAsync(formData);
    // Redirect to feed after successful upload
    navigate('/my/feed');
  };

  return (
    <div className="flex flex-col gap-4 p-4 overflow-auto">
      <h1 className="text-2xl font-bold">Upload Photo</h1>

      {createPostMutation.isPending ? (
        <Card className="p-6">
          <p className="text-lg">Uploading photo...</p>
        </Card>
      ) : !createPostMutation.isSuccess ? (
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
    </div>
  );
}

export default MyFeed;
