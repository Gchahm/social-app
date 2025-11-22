import { useQuery } from '@tanstack/react-query';
import { get } from 'aws-amplify/api';
import {
  getCommentsResponseSchema,
  type GetCommentsResponse,
} from '@chahm/types';
import type { DefaultError } from '@tanstack/query-core';

interface UseCommentsParams {
  postId: string;
  limit?: number;
  enabled?: boolean;
}

export function useComments({
  postId,
  limit = 20,
  enabled = true,
}: UseCommentsParams) {
  return useQuery<GetCommentsResponse, DefaultError, GetCommentsResponse>({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const restOperation = get({
        apiName: 'SocialApp',
        path: `posts/${postId}/comments`,
        options: {
          queryParams: {
            limit: limit.toString(),
          },
        },
      });

      const { body } = await restOperation.response;
      return getCommentsResponseSchema.parse(await body.json());
    },
    enabled,
  });
}
