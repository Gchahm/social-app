import '@chahm/ui-components/styles/globals.css';
import { UploadImageForm } from '../components';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Textarea,
  Label,
} from '@chahm/ui-components';
import {
  useRequestUploadUrl,
  useConfirmUpload,
  useCreatePost,
} from '../hooks';

export function Upload() {
  const [uploadedPhoto, setUploadedPhoto] = useState<{
    imageId: string;
    imageKey: string;
  } | null>(null);
  const [createPostMode, setCreatePostMode] = useState(false);
  const [caption, setCaption] = useState('');

  // Hooks for API calls
  const requestUploadUrlMutation = useRequestUploadUrl();
  const confirmUploadMutation = useConfirmUpload();
  const createPostMutation = useCreatePost();

  // Step 2: Upload to S3 directly
  const uploadToS3 = async (file: File, uploadUrl: string) => {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!response.ok) {
      throw new Error('Failed to upload to S3');
    }
  };

  // Combined upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (payload: {
      file: File;
      title: string;
      description?: string;
    }) => {
      // Step 1: Get presigned URL
      const { uploadUrl, imageKey, imageId } = await requestUploadUrlMutation.mutateAsync({
        fileName: payload.file.name,
        contentType: payload.file.type,
      });

      // Step 2: Upload to S3
      await uploadToS3(payload.file, uploadUrl);

      // Step 3: Confirm upload
      await confirmUploadMutation.mutateAsync({
        imageId,
        imageKey,
        title: payload.title,
        description: payload.description,
      });

      return { imageId, imageKey };
    },
    onSuccess: (data) => {
      setUploadedPhoto(data);
    },
    onError: (error) => {
      console.error('Upload failed:', error);
    },
  });

  // Create post mutation wrapper
  const postMutation = useMutation({
    mutationFn: async () => {
      if (!uploadedPhoto) throw new Error('No photo uploaded');

      return await createPostMutation.mutateAsync({
        imageKey: uploadedPhoto.imageKey,
        caption: caption || undefined,
      });
    },
    onSuccess: () => {
      // Reset state
      setUploadedPhoto(null);
      setCreatePostMode(false);
      setCaption('');
    },
    onError: (error) => {
      console.error('Failed to create post:', error);
    },
  });

  // Handle form submission
  const handleUpload = async (formData: {
    base64: string;
    fileName: string;
    title: string;
    description?: string;
  }) => {
    // Convert base64 to File
    const base64Data = formData.base64.split(',')[1] || formData.base64;
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });
    const file = new File([blob], formData.fileName, { type: 'image/jpeg' });

    await uploadMutation.mutateAsync({
      file,
      title: formData.title,
      description: formData.description,
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4 overflow-auto max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">Upload Photo</h1>

      {!uploadedPhoto ? (
        // Upload form
        <UploadImageForm onSubmit={handleUpload} />
      ) : !createPostMode ? (
        // Post-upload options
        <Card>
          <CardHeader>
            <CardTitle>Photo uploaded successfully!</CardTitle>
            <CardDescription>
              Your photo has been saved to your library. Would you like to
              create a post with this photo?
            </CardDescription>
          </CardHeader>
          <CardFooter className="gap-3">
            <Button onClick={() => setCreatePostMode(true)}>Create Post</Button>
            <Button
              variant="outline"
              onClick={() => {
                setUploadedPhoto(null);
                setCaption('');
              }}
            >
              Upload Another Photo
            </Button>
          </CardFooter>
        </Card>
      ) : (
        // Create post form
        <Card>
          <CardHeader>
            <CardTitle>Create Post</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="caption">Caption (optional)</Label>
              <Textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption for your post..."
                disabled={postMutation.isPending}
              />
            </div>
          </CardContent>
          <CardFooter className="gap-3">
            <Button
              onClick={() => postMutation.mutate()}
              disabled={postMutation.isPending}
            >
              {postMutation.isPending ? 'Creating Post...' : 'Create Post'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setCreatePostMode(false);
                setCaption('');
              }}
              disabled={postMutation.isPending}
            >
              Cancel
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Loading state */}
      {uploadMutation.isPending && (
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
