import { FormEvent, useState } from 'react';
import {
  Button,
  Field,
  FieldLabel,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
  Input,
  FieldError,
} from '@chahm/ui-components';
import { useForm } from '@tanstack/react-form';
import { uploadPhotoSchema, UploadPhotoPayload } from '@chahm/types';

interface UploadResponse {
  key: string;
  bucket: string;
  contentType: string;
}

const POST_URL = import.meta.env.VITE_POST_URL as string | undefined;

const formDefaultValues: UploadPhotoPayload = {
  fileName: '',
  title: '',
  description: '',
  base64: '',
};

export function UploadImageForm() {
  const [file, setFile] = useState<File | null>(null);

  const form = useForm({
    defaultValues: formDefaultValues,
    validators: {
      onBlur: uploadPhotoSchema,
    },
    onSubmit: async ({ value }) => {
      // Do something with form data
      console.log(value);
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

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // try {
    // const base64 = await fileToDataUrl(file);
    // const payload = {
    //   fileName: file.name,
    //   title: title || file.name,
    //   description: description || undefined,
    //   base64, // data URL format supported by backend
    // };

    // const res = await fetch(POST_URL, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(payload),
  };

  return (
    <div className="max-w-xl w-full border rounded-md p-4 bg-white/50">
      <h3 className="font-semibold text-lg mb-3">Upload Image</h3>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
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
              return (
                <InputGroup className="h-auto items-start">
                  <InputGroupAddon align="block-start">
                    Description
                  </InputGroupAddon>
                  <InputGroupTextarea
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-label="Description"
                    placeholder="Optional description"
                    rows={3}
                    // disabled={loading}
                  />
                </InputGroup>
              );
            }}
          />
        </div>
        <div>
          <form.Field
            name="base64"
            children={(field) => {
              return (
                <>
                  <InputGroup>
                    <InputGroupAddon>Image file</InputGroupAddon>
                    <InputGroupInput
                      id={field.name}
                      name={field.name}
                      // value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      type="file"
                      aria-label="Image file"
                      accept="image/*"
                      // disabled={loading}
                    />
                  </InputGroup>
                  {file && (
                    <p className="text-xs text-gray-600 mt-1">
                      Selected: {file.name}
                    </p>
                  )}
                </>
              );
            }}
          />
        </div>

        {/*{error && (*/}
        {/*  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">*/}
        {/*    {error}*/}
        {/*  </div>*/}
        {/*)}*/}
        {/*{result && (*/}
        {/*  <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">*/}
        {/*    Uploaded! S3 key: <code className="font-mono">{result.key}</code>*/}
        {/*  </div>*/}
        {/*)}*/}

        <div className="flex gap-2">
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <Button type="submit" disabled={!canSubmit}>
                {isSubmitting ? '...' : 'Submit'}
              </Button>
            )}
          />
          {!POST_URL && (
            <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
              VITE_POST_URL is not set
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

export default UploadImageForm;
