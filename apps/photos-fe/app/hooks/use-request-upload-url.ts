import { useMutation } from '@tanstack/react-query';
import { post } from 'aws-amplify/api';
import type { RequestUploadUrlResponse } from '@chahm/types';

interface RequestUploadUrlPayload {
  fileName: string;
  contentType: string;
}

export function useRequestUploadUrl() {
  return useMutation({
    mutationFn: async (payload: RequestUploadUrlPayload) => {
      const restOperation = post({
        apiName: 'SocialApp',
        path: 'photos/upload-url',
        options: {
          body: payload,
        },
      });

      const { body } = await restOperation.response;
      return (await body.json()) as RequestUploadUrlResponse;
    },
  });
}
