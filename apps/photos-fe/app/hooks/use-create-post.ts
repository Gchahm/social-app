import { useMutation } from '@tanstack/react-query';
import { post } from 'aws-amplify/api';
import type { CreatePostPayload, CreatePostResponse } from '@chahm/types';

export function useCreatePost() {
  return useMutation({
    mutationFn: async (payload: CreatePostPayload) => {
      const restOperation = post({
        apiName: 'SocialApp',
        path: 'posts',
        options: {
          body: payload,
        },
      });

      const { body } = await restOperation.response;
      return (await body.json()) as CreatePostResponse;
    },
  });
}
