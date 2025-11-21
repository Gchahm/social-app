import { useQuery } from '@tanstack/react-query';
import { get } from 'aws-amplify/api';
import {
  getPostResponseSchema,
  GetPostsQueryParameters,
  GetPostsResponse,
} from '@chahm/types';
import type { DefaultError } from '@tanstack/query-core';

export function usePosts(props: GetPostsQueryParameters) {
  return useQuery<GetPostsResponse, DefaultError, GetPostsResponse>({
    queryKey: ['posts'],
    queryFn: async () => {
      const restOperation = get({
        apiName: 'SocialApp',
        path: 'posts',
        options: {
          queryParams: { userId: props.userId || '' },
        },
      });

      const { body } = await restOperation.response;
      return getPostResponseSchema.parse(await body.json());
    },
  });
}
