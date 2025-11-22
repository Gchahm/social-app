import { useMutation } from '@tanstack/react-query';
import { post } from 'aws-amplify/api';
import type {
  CreatePostPayload,
  CreatePostResponse,
  RequestUploadUrlPayload,
  RequestUploadUrlResponse,
  UploadPhotoPayload,
} from '@chahm/types';

export function useCreatePost() {
  return useMutation({
    mutationFn: async (payload: UploadPhotoPayload) => {
      // Step 1: Get presigned URL
      const { uploadUrl, imageKey } = await requestUploadUrl({
        fileName: payload.file.name,
        contentType: payload.file.type,
      });

      // Step 2: Upload to S3
      await uploadToS3(payload.file, uploadUrl);

      return await createPost({
        imageKey: imageKey,
        caption: payload.description,
      });
    },
  });
}

async function requestUploadUrl(payload: RequestUploadUrlPayload) {
  const restOperation = post({
    apiName: 'SocialApp',
    path: 'photos/upload-url',
    options: {
      body: payload,
    },
  });

  const { body } = await restOperation.response;
  //TODO: check how this should be done
  return (await body.json()) as unknown as RequestUploadUrlResponse;
}

async function uploadToS3(file: File, uploadUrl: string) {
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
}

async function createPost(payload: CreatePostPayload) {
  const restOperation = post({
    apiName: 'SocialApp',
    path: 'posts',
    options: {
      body: payload,
    },
  });

  const { body } = await restOperation.response;
  //TODO: check how this should be done
  return (await body.json()) as unknown as CreatePostResponse;
}
