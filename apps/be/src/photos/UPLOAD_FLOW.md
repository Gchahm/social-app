# Photo Upload Flow - Presigned URL (Option 2)

This document explains the recommended photo upload flow using presigned URLs for direct S3 uploads.

## Overview

The presigned URL flow provides the best performance and scalability by uploading photos directly to S3, bypassing Lambda's 6MB payload limit.

## Frontend Flow

```typescript
// Complete photo upload flow
async function uploadPhoto(file: File, title: string, description?: string) {
  try {
    // Step 1: Request presigned URL from backend
    const { uploadUrl, imageKey, imageId } = await requestUploadUrl(
      file.name,
      file.type
    );

    // Step 2: Upload directly to S3 using presigned URL
    await uploadToS3(file, uploadUrl);

    // Step 3: Confirm upload and save metadata to DynamoDB
    await confirmUpload(imageId, imageKey, title, description);

    console.log('Photo uploaded successfully!');
    return { imageId, imageKey };
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}

// Step 1: Request presigned URL
async function requestUploadUrl(fileName: string, contentType: string) {
  const response = await fetch('/photos/upload-url', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileName,
      contentType,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to get upload URL');
  }

  return await response.json();
}

// Step 2: Upload to S3
async function uploadToS3(file: File, uploadUrl: string) {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error('Failed to upload to S3');
  }
}

// Step 3: Confirm upload
async function confirmUpload(
  imageId: string,
  imageKey: string,
  title: string,
  description?: string
) {
  const response = await fetch('/photos/confirm', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageId,
      imageKey,
      title,
      description,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to confirm upload');
  }

  return await response.json();
}
```

## React Component Example

```typescript
import { useState } from 'react';

function PhotoUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string>('');

  // Preview image when file is selected
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setProgress(0);

    try {
      // Step 1: Get presigned URL
      setProgress(10);
      const { uploadUrl, imageKey, imageId } = await requestUploadUrl(
        file.name,
        file.type
      );

      // Step 2: Upload to S3
      setProgress(40);
      await uploadToS3(file, uploadUrl);

      // Step 3: Confirm upload
      setProgress(80);
      await confirmUpload(imageId, imageKey, title, description);

      setProgress(100);
      alert('Photo uploaded successfully!');

      // Reset form
      setFile(null);
      setTitle('');
      setDescription('');
      setPreview('');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <form onSubmit={handleUpload} className="upload-form">
      <h2>Upload Photo</h2>

      <div className="file-input">
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </div>

      {preview && (
        <div className="preview">
          <img src={preview} alt="Preview" style={{ maxWidth: '300px' }} />
        </div>
      )}

      <div className="form-group">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Photo title"
          required
          disabled={uploading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description (optional)</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Photo description"
          disabled={uploading}
        />
      </div>

      <button type="submit" disabled={!file || uploading}>
        {uploading ? `Uploading... ${progress}%` : 'Upload Photo'}
      </button>

      {uploading && (
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </form>
  );
}
```

## API Endpoints

### 1. Request Upload URL

```
POST /photos/upload-url
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "fileName": "sunset.jpg",
  "contentType": "image/jpeg"
}

Response (200):
{
  "uploadUrl": "https://bucket.s3.amazonaws.com/photos/user123/uuid.jpg?X-Amz-...",
  "imageKey": "photos/user123/uuid.jpg",
  "imageId": "uuid",
  "expiresIn": 300
}
```

### 2. Upload to S3

```
PUT <uploadUrl>
Content-Type: image/jpeg

Body: <binary file data>

Response: 200 OK (no body)
```

### 3. Confirm Upload

```
POST /photos/confirm
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "imageId": "uuid",
  "imageKey": "photos/user123/uuid.jpg",
  "title": "Beautiful sunset",
  "description": "Taken at the beach"
}

Response (201):
{
  "message": "Photo saved successfully",
  "photo": {
    "imageId": "uuid",
    "userId": "user123",
    "originalS3Key": "photos/user123/uuid.jpg",
    "title": "Beautiful sunset",
    "description": "Taken at the beach",
    "createdAt": "2025-01-15T12:00:00.000Z"
  }
}
```

## Using Photos in Posts

After uploading a photo, you can create a post using the imageKey:

```typescript
// Upload photo first
const { imageKey } = await uploadPhoto(file, 'My photo');

// Then create post with the photo
await fetch('/posts', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    imageKey,  // Use the key from photo upload
    caption: 'Check out this amazing photo!',
  }),
});
```

## Error Handling

```typescript
async function uploadPhoto(file: File, title: string) {
  try {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Invalid file type: ${file.type}`);
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size must be less than 10MB');
    }

    // Request upload URL
    const { uploadUrl, imageKey, imageId } = await requestUploadUrl(
      file.name,
      file.type
    );

    // Upload to S3 with retry
    let uploadSuccess = false;
    let retries = 3;

    while (!uploadSuccess && retries > 0) {
      try {
        await uploadToS3(file, uploadUrl);
        uploadSuccess = true;
      } catch (error) {
        retries--;
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Confirm upload
    await confirmUpload(imageId, imageKey, title);

    return { imageId, imageKey };
  } catch (error) {
    console.error('Upload failed:', error);

    // Handle specific errors
    if (error.message.includes('Invalid file type')) {
      alert('Please upload a valid image file (JPEG, PNG, WebP, or GIF)');
    } else if (error.message.includes('File size')) {
      alert('File is too large. Maximum size is 10MB');
    } else if (error.message.includes('Unauthorized')) {
      // Redirect to login
      window.location.href = '/login';
    } else {
      alert('Failed to upload photo. Please try again.');
    }

    throw error;
  }
}
```

## Benefits

✅ **No size limits** - Upload files of any size (not limited by Lambda's 6MB payload)
✅ **Better performance** - Direct S3 upload, no Lambda processing
✅ **Lower cost** - Less Lambda execution time
✅ **Real progress** - Can track upload progress with XMLHttpRequest
✅ **Scalable** - Works for photos and videos

## Architecture

```
Frontend                     Backend                      AWS
┌────────┐                  ┌────────┐                   ┌────┐
│        │ 1. Request URL   │ Lambda │                   │    │
│        ├─────────────────>│        │                   │    │
│        │                  │        │                   │    │
│        │ 2. Presigned URL │        │                   │    │
│        │<─────────────────┤        │                   │    │
│ Client │                  └────────┘                   │ S3 │
│        │                                               │    │
│        │ 3. Direct Upload                              │    │
│        ├──────────────────────────────────────────────>│    │
│        │                                               │    │
│        │                  ┌────────┐                   │    │
│        │ 4. Confirm       │ Lambda │                   │    │
│        ├─────────────────>│        │                   │    │
│        │                  │        │ 5. Save metadata  │    │
│        │                  │        ├──────────────────>│ DB │
└────────┘                  └────────┘                   └────┘
```

## Security

- Presigned URLs expire after 5 minutes
- URLs are scoped to specific file paths (photos/{userId}/...)
- File uploads are validated for content type
- Users can only upload to their own folder
- Metadata confirmation verifies image ownership

## Testing

```bash
# Test complete flow
curl -X POST https://api.example.com/photos/upload-url \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fileName":"test.jpg","contentType":"image/jpeg"}'

# Use the uploadUrl to upload file
curl -X PUT "$UPLOAD_URL" \
  -H "Content-Type: image/jpeg" \
  --data-binary @test.jpg

# Confirm the upload
curl -X POST https://api.example.com/photos/confirm \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"imageId":"uuid","imageKey":"photos/user123/uuid.jpg","title":"Test"}'
```
