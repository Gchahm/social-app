import { useQuery } from '@tanstack/react-query';
import { get } from 'aws-amplify/api';
import { Image } from '@chahm/types';
import type { DefaultError } from '@tanstack/query-core';

export interface GetPhotosResponse {
  images: Image[];
  count: number;
}

export function usePhotos() {
  return useQuery<GetPhotosResponse, DefaultError, GetPhotosResponse>({
    queryKey: ['photos'],
    queryFn: async () => {
      const restOperation = get({
        apiName: 'photos',
        path: '/photos',
      });

      const { body } = await restOperation.response;
      return await body.json();
    },
  });
}
