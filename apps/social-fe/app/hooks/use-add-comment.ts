import { useMutation, useQueryClient } from '@tanstack/react-query';
import { post } from 'aws-amplify/api';
import {
  addCommentResponseSchema,
  type AddCommentPayload,
  type AddCommentResponse,
} from '@chahm/types';

interface AddCommentParams {
  postId: string;
  content: string;
}

export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation<AddCommentResponse, Error, AddCommentParams>({
    mutationFn: async ({ postId, content }: AddCommentParams) => {
      const restOperation = post({
        apiName: 'SocialApp',
        path: `posts/${postId}/comments`,
        options: {
          body: {
            content,
          } as AddCommentPayload,
        },
      });

      const { body } = await restOperation.response;
      return addCommentResponseSchema.parse(await body.json());
    },
    onSuccess: (_, { postId }) => {
      // Invalidate comments query to refetch
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      // Invalidate posts query to update comment count
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
