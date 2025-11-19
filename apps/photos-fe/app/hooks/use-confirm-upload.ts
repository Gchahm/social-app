import { useMutation } from '@tanstack/react-query';
import { post } from 'aws-amplify/api';
import type { ConfirmUploadPayload, ConfirmUploadResponse } from '@chahm/types';

export function useConfirmUpload() {
  return useMutation({
    mutationFn: async (payload: ConfirmUploadPayload) => {
      const restOperation = post({
        apiName: 'SocialApp',
        path: 'photos/confirm',
        options: {
          body: payload,
        },
      });

      const { body } = await restOperation.response;
      return (await body.json()) as ConfirmUploadResponse;
    },
  });
}
