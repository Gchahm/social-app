import { useQuery } from '@tanstack/react-query';
import { get } from 'aws-amplify/api';
import { GetPostsResponse } from '@chahm/types';
import type { DefaultError } from '@tanstack/query-core';

export function usePosts() {
  return useQuery<GetPostsResponse, DefaultError, GetPostsResponse>({
    queryKey: ['posts'],
    queryFn: async () => {
      const restOperation = get({
        apiName: 'SocialApp',
        path: '/posts',
      });

      const { body } = await restOperation.response;
      return await body.json();
    },
  });
}
