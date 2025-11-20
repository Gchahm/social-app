# Frontend Flow for Creating Posts with Images

This document outlines the recommended frontend flows for creating posts with images stored in S3.

## Overview

There are three main approaches for handling image uploads and post creation:

1. **Two-Step Flow** - Upload image, then create post
2. **Presigned URL Flow** - Direct S3 upload (recommended for production)
3. **Single Request Flow** - Combined upload and post creation

---

## Option 1: Two-Step Flow (Simple)

Best for: Small to medium images, getting started quickly

### Frontend Flow

```typescript
// Step 1: Upload image using existing /photos endpoint
async function uploadImage(imageFile: File) {
  const base64 = await fileToBase64(imageFile);

  const response = await fetch('/photos', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      base64,
      fileName: imageFile.name,
      title: 'Post image',
    }),
  });

  const { imageId, key } = await response.json();
  return { imageId, key };
}

// Step 2: Create post with image reference
async function createPost(imageKey: string, caption: string) {
  const response = await fetch('/posts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageKey,  // or imageUrl
      caption,
    }),
  });

  return await response.json();
}

// Complete flow
async function handleCreatePost(imageFile: File, caption: string) {
  // Upload image
  const { key } = await uploadImage(imageFile);

  // Create post
  const post = await createPost(key, caption);

  console.log('Post created:', post);
}
```

**Pros:**
- Simple to implement
- Uses existing `/photos` endpoint
- Can preview image before posting

**Cons:**
- Two network requests
- Orphaned images if user abandons post creation
- Image goes through Lambda (6MB limit)

---

## Option 2: Presigned URL Flow (Recommended for Production)

Best for: Large images, production apps, better performance

### Frontend Flow

```typescript
// Step 1: Request presigned URL for S3 upload
async function requestUploadUrl(fileName: string, contentType: string) {
  const response = await fetch('/posts/upload-url', {
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

  return await response.json();
}

// Step 2: Upload directly to S3 using presigned URL
async function uploadToS3(file: File, uploadUrl: string) {
  await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  });
}

// Step 3: Create post with image reference
async function createPost(imageKey: string, caption: string) {
  const response = await fetch('/posts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageKey,
      caption,
    }),
  });

  return await response.json();
}

// Complete flow
async function handleCreatePost(imageFile: File, caption: string) {
  // Get presigned URL
  const { uploadUrl, imageKey, imageUrl } = await requestUploadUrl(
    imageFile.name,
    imageFile.type
  );

  // Upload directly to S3
  await uploadToS3(imageFile, uploadUrl);

  // Create post
  const post = await createPost(imageKey, caption);

  console.log('Post created:', post);
}
```

**Pros:**
- ✅ Direct S3 upload (bypasses Lambda)
- ✅ No file size limits (Lambda has 6MB limit)
- ✅ Faster uploads
- ✅ Lower cost (less Lambda execution time)
- ✅ Better for large images/videos

**Cons:**
- More complex implementation
- Requires handling S3 errors on frontend

---

## Option 3: React Example with Progress

```typescript
import { useState } from 'react';

function CreatePostForm() {
  const [image, setImage] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!image) return;

    setUploading(true);
    setProgress(0);

    try {
      // Get presigned URL
      setProgress(10);
      const { uploadUrl, imageKey } = await requestUploadUrl(
        image.name,
        image.type
      );

      // Upload to S3
      setProgress(30);
      await uploadToS3(image, uploadUrl);

      // Create post
      setProgress(70);
      const post = await createPost(imageKey, caption);

      setProgress(100);
      console.log('Post created successfully!', post);

      // Reset form
      setImage(null);
      setCaption('');
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files?.[0] || null)}
        disabled={uploading}
      />

      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Write a caption..."
        disabled={uploading}
      />

      <button type="submit" disabled={!image || uploading}>
        {uploading ? `Uploading... ${progress}%` : 'Create Post'}
      </button>

      {uploading && (
        <div className="progress-bar">
          <div style={{ width: `${progress}%` }} />
        </div>
      )}
    </form>
  );
}
```

---

## Image Preview Before Posting

```typescript
function ImagePreview({ file }: { file: File }) {
  const [preview, setPreview] = useState<string>('');

  useEffect(() => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, [file]);

  return preview ? <img src={preview} alt="Preview" /> : null;
}
```

---

## Error Handling

```typescript
async function handleCreatePost(imageFile: File, caption: string) {
  try {
    // Validate file
    if (imageFile.size > 10 * 1024 * 1024) {
      throw new Error('Image must be less than 10MB');
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(imageFile.type)) {
      throw new Error('Invalid file type. Use JPEG, PNG, WebP, or GIF');
    }

    // Get presigned URL
    const { uploadUrl, imageKey } = await requestUploadUrl(
      imageFile.name,
      imageFile.type
    );

    // Upload to S3 with retry logic
    let retries = 3;
    while (retries > 0) {
      try {
        await uploadToS3(imageFile, uploadUrl);
        break;
      } catch (error) {
        retries--;
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Create post
    const post = await createPost(imageKey, caption);
    return post;

  } catch (error) {
    console.error('Error creating post:', error);

    if (error.message.includes('Unauthorized')) {
      // Redirect to login
      window.location.href = '/login';
    } else if (error.message.includes('file type')) {
      alert(error.message);
    } else {
      alert('Failed to create post. Please try again.');
    }

    throw error;
  }
}
```

---

## API Endpoints Summary

### Upload Image (Existing)
```
POST /photos
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  "base64": "data:image/jpeg;base64,...",
  "fileName": "photo.jpg",
  "title": "My photo"
}

Response:
{
  "imageId": "uuid",
  "key": "photos/uuid",
  "message": "Image uploaded successfully"
}
```

### Request Upload URL (New)
```
POST /posts/upload-url
Content-Type: application/json
Authorization: Bearer <token>

Body:
{
  "fileName": "photo.jpg",
  "contentType": "image/jpeg"
}

Response:
{
  "uploadUrl": "https://bucket.s3.amazonaws.com/...",
  "imageKey": "posts/user123/uuid.jpg",
  "imageUrl": "https://bucket.s3.amazonaws.com/posts/user123/uuid.jpg",
  "expiresIn": 300
}
```

### Create Post
```
POST /posts
Content-Type: application/json
Authorization: Bearer <token>

Body (Option 1 - with imageKey):
{
  "imageKey": "posts/user123/uuid.jpg",
  "caption": "Beautiful sunset!"
}

Body (Option 2 - with imageUrl):
{
  "imageUrl": "https://bucket.s3.amazonaws.com/posts/user123/uuid.jpg",
  "caption": "Beautiful sunset!"
}

Response:
{
  "message": "Post created successfully",
  "post": {
    "postId": "uuid",
    "userId": "user123",
    "imageUrl": "https://...",
    "caption": "Beautiful sunset!",
    "likeCount": 0,
    "commentCount": 0,
    "createdAt": "2025-01-15T12:00:00.000Z"
  }
}
```

---

## Recommended Flow for Your App

**For Instagram-like UX:**

Use **Option 2 (Presigned URL Flow)** with these steps:

1. User selects image
2. Show image preview
3. User writes caption
4. On submit:
   - Request presigned URL
   - Upload to S3 directly
   - Create post with imageKey
5. Show success message and redirect to feed

This provides the best performance and user experience while keeping costs low.
