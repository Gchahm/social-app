import { useState, useEffect } from 'react';
import {
  Button,
  Field,
  FieldError,
  FieldLabel,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
} from '@chahm/ui-components';
import { useForm } from '@tanstack/react-form';
import { UploadPhotoPayload, uploadPhotoSchema } from '@chahm/types';

const formDefaultValues: UploadPhotoPayload = {
  description: '',
  file: new File([], 'empty'),
};

type UploadImageFormProps = {
  onSubmit: (data: UploadPhotoPayload) => Promise<void>;
};

export function UploadImageForm(props: UploadImageFormProps) {
  const { onSubmit } = props;
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const form = useForm({
    defaultValues: formDefaultValues,
    validators: {
      onBlur: uploadPhotoSchema,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="max-w-xl w-full border rounded-md p-4 bg-white/50">
      <h3 className="font-semibold text-lg mb-3">Upload Image</h3>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await form.handleSubmit();
        }}
        className="flex flex-col gap-3"
      >
        <div>
          <form.Field
            name="file"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <InputGroup>
                    <InputGroupAddon>Image file</InputGroupAddon>
                    <InputGroupInput
                      id={field.name}
                      name={field.name}
                      onChange={async (e) => {
                        const file = e.currentTarget.files?.[0];
                        if (file) {
                          // Revoke previous preview URL to avoid memory leaks
                          if (previewUrl) {
                            URL.revokeObjectURL(previewUrl);
                          }
                          // Create new preview URL
                          const newPreviewUrl = URL.createObjectURL(file);
                          setPreviewUrl(newPreviewUrl);
                          field.handleChange(file);
                        }
                      }}
                      type="file"
                      aria-label="Image file"
                      accept="image/*"
                    />
                  </InputGroup>
                  <div className="mt-3">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-w-full h-auto rounded-md border"
                      />
                    ) : (
                      <div className="w-full aspect-video bg-gray-100 rounded-md border border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                        No image selected
                      </div>
                    )}
                  </div>
                </Field>
              );
            }}
          />
        </div>
        <div>
          <form.Field
            name="description"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                  <InputGroup className="h-auto items-start">
                    <InputGroupTextarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      autoComplete="off"
                      aria-label="Description"
                      placeholder="Optional description"
                      rows={3}
                      // disabled={loading}
                    />
                  </InputGroup>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />
        </div>

        <div className="flex gap-2">
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <Button type="submit" disabled={!canSubmit}>
                {isSubmitting ? '...' : 'Submit'}
              </Button>
            )}
          />
        </div>
      </form>
    </div>
  );
}

export default UploadImageForm;
