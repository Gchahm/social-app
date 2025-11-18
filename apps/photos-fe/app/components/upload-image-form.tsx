import { useState } from 'react';
import {
  Button,
  Field,
  FieldError,
  FieldLabel,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
} from '@chahm/ui-components';
import { useForm } from '@tanstack/react-form';
import {
  UploadPhotoPayload,
  UploadPhotoResponse,
  uploadPhotoSchema,
} from '@chahm/types';

const formDefaultValues: UploadPhotoPayload = {
  fileName: '',
  title: '',
  description: '',
  base64: '',
};

type UploadImageFormProps = {
  onSubmit: (data: UploadPhotoPayload) => Promise<UploadPhotoResponse>;
};

export function UploadImageForm(props: UploadImageFormProps) {
  const { onSubmit } = props;

  const [file, setFile] = useState<File | null>(null);

  const form = useForm({
    defaultValues: formDefaultValues,
    validators: {
      onBlur: uploadPhotoSchema,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  async function fileToDataUrl(f: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(f);
    });
  }

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
            name="title"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Title</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="My photo title"
                    autoComplete="off"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
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
        <div>
          <form.Field
            name="base64"
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
                        const f = e.currentTarget.files?.[0] ?? null;
                        setFile(f);
                        if (!f) {
                          field.handleChange('');
                          form.setFieldValue('fileName', '');
                          return;
                        }
                        const dataUrl = await fileToDataUrl(f);
                        field.handleChange(dataUrl);
                        form.setFieldValue('fileName', f.name);
                      }}
                      type="file"
                      aria-label="Image file"
                      accept="image/*"
                    />
                  </InputGroup>
                  {file && (
                    <p className="text-xs text-gray-600 mt-1">
                      {/*Selected: {file.name}*/}
                    </p>
                  )}
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
