import '@chahm/ui-components/styles/globals.css';
import { UploadImageForm } from '../components';
import { useMutation } from '@tanstack/react-query';
import { UploadPhotoPayload, UploadPhotoResponse } from '@chahm/types';
import { post } from 'aws-amplify/api';

export function Upload() {
  const mutation = useMutation<UploadPhotoResponse, Error, UploadPhotoPayload>({
    mutationFn: async (payload) => {
      const restOperation = post({
        apiName: 'photos',
        path: 'photos',
        options: {
          body: payload,
        },
      });

      const { body } = await restOperation.response;
      return await body.json();
    },
  });
  return (
    <div className="flex flex-col gap-4 p-4 overflow-auto">
      <UploadImageForm onSubmit={mutation.mutateAsync} />
    </div>
  );
}

export default Upload;
