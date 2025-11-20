import { useMutation, useQueryClient } from '@tanstack/react-query';
import { post, del } from 'aws-amplify/api';
import type { GetPostsResponse } from '@chahm/types';

interface LikePostParams {
  postId: string;
  isLiked: boolean;
}

export function useLikePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, isLiked }: LikePostParams) => {
      if (isLiked) {
        // Unlike the post
        const restOperation = del({
          apiName: 'SocialApp',
          path: `posts/${postId}/like`,
        });

        const { body } = await restOperation.response;
        return await body.json();
      } else {
        // Like the post
        const restOperation = post({
          apiName: 'SocialApp',
          path: `posts/${postId}/like`,
        });

        const { body } = await restOperation.response;
        return await body.json();
      }
    },
    onMutate: async ({ postId, isLiked }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['posts'] });

      // Snapshot the previous value
      const previousPosts = queryClient.getQueryData<GetPostsResponse>(['posts']);

      // Optimistically update the cache
      queryClient.setQueryData<GetPostsResponse>(['posts'], (old) => {
        if (!old) return old;

        return {
          ...old,
          posts: old.posts.map((post) =>
            post.postId === postId
              ? {
                  ...post,
                  likeCount: isLiked ? post.likeCount - 1 : post.likeCount + 1,
                }
              : post
          ),
        };
      });

      // Return context with the previous value
      return { previousPosts };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousPosts) {
        queryClient.setQueryData(['posts'], context.previousPosts);
      }
    },
  });
}
