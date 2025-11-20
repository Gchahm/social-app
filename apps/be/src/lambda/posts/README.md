# Posts API

Lambda functions for managing posts, likes, and comments in the social media application.

## Overview

This module provides REST API handlers for all post-related operations. All handlers automatically integrate with the database access layer (`apps/be/src/database/`) and maintain data consistency through composite operations.

## Authentication

All endpoints (except list/get public posts) require authentication. The user ID is extracted from the API Gateway event's `requestContext.authorizer` or `x-user-id` header.

## API Endpoints

### Post Management

#### Create Post
```
POST /posts
```

**Request Body:**
```json
{
  "imageUrl": "https://example.com/image.jpg",
  "caption": "Optional caption text"
}
```

**Response (201):**
```json
{
  "message": "Post created successfully",
  "post": {
    "postId": "uuid",
    "userId": "user-id",
    "imageUrl": "https://...",
    "caption": "...",
    "likeCount": 0,
    "commentCount": 0,
    "createdAt": "2025-01-15T12:00:00.000Z",
    "updatedAt": "2025-01-15T12:00:00.000Z"
  }
}
```

**Handler:** `apps/be/src/posts/create.ts`

---

#### Get Post
```
GET /posts/:postId
```

**Response (200):**
```json
{
  "post": {
    "postId": "uuid",
    "userId": "user-id",
    "imageUrl": "https://...",
    "caption": "...",
    "likeCount": 10,
    "commentCount": 5,
    "createdAt": "2025-01-15T12:00:00.000Z",
    "updatedAt": "2025-01-15T12:00:00.000Z"
  }
}
```

**Handler:** `apps/be/src/posts/get.ts`

---

#### List Posts
```
GET /posts?userId=xxx&limit=20&lastEvaluatedKey=...
```

**Query Parameters:**
- `userId` (optional): Filter by user ID. If omitted, returns global feed.
- `limit` (optional): Number of items (default: 20)
- `lastEvaluatedKey` (optional): Pagination token (JSON string)

**Response (200):**
```json
{
  "posts": [...],
  "count": 20,
  "lastEvaluatedKey": "base64-encoded-key"
}
```

**Handler:** `apps/be/src/posts/list.ts`

---

#### Update Post
```
PUT /posts/:postId
```

**Request Body:**
```json
{
  "caption": "Updated caption"
}
```

**Response (200):**
```json
{
  "message": "Post updated successfully",
  "post": {...}
}
```

**Authorization:** Only the post owner can update their post.

**Handler:** `apps/be/src/posts/update.ts`

---

#### Delete Post
```
DELETE /posts/:postId
```

**Response (200):**
```json
{
  "message": "Post deleted successfully"
}
```

**Authorization:** Only the post owner can delete their post.

**Handler:** `apps/be/src/posts/delete.ts`

---

### Likes

#### Like Post
```
POST /posts/:postId/like
```

**Response (200):**
```json
{
  "message": "Post liked successfully"
}
```

**Error (409):** If already liked
```json
{
  "message": "You have already liked this post"
}
```

**Handler:** `apps/be/src/posts/like.ts`

---

#### Unlike Post
```
DELETE /posts/:postId/like
```

**Response (200):**
```json
{
  "message": "Post unliked successfully"
}
```

**Error (409):** If not liked
```json
{
  "message": "You have not liked this post"
}
```

**Handler:** `apps/be/src/posts/unlike.ts`

---

### Comments

#### Add Comment
```
POST /posts/:postId/comments
```

**Request Body:**
```json
{
  "content": "Great photo!"
}
```

**Response (201):**
```json
{
  "message": "Comment added successfully",
  "commentId": "uuid"
}
```

**Handler:** `apps/be/src/posts/add-comment.ts`

---

#### Get Comments
```
GET /posts/:postId/comments?limit=20&lastEvaluatedKey=...
```

**Query Parameters:**
- `limit` (optional): Number of items (default: 20)
- `lastEvaluatedKey` (optional): Pagination token (JSON string)

**Response (200):**
```json
{
  "comments": [
    {
      "commentId": "uuid",
      "postId": "post-id",
      "userId": "user-id",
      "content": "Great photo!",
      "createdAt": "2025-01-15T12:00:00.000Z",
      "updatedAt": "2025-01-15T12:00:00.000Z"
    }
  ],
  "count": 20,
  "lastEvaluatedKey": "base64-encoded-key"
}
```

**Handler:** `apps/be/src/posts/get-comments.ts`

---

#### Delete Comment
```
DELETE /posts/:postId/comments/:commentId
```

**Response (200):**
```json
{
  "message": "Comment deleted successfully"
}
```

**Authorization:** Only the comment owner can delete their comment.

**Handler:** `apps/be/src/posts/delete-comment.ts`

---

## Error Responses

All endpoints return standardized error responses:

**400 Bad Request:**
```json
{
  "message": "Missing required fields: imageUrl",
  "error": "..."
}
```

**401 Unauthorized:**
```json
{
  "message": "Unauthorized",
  "error": "User ID not found in request context"
}
```

**403 Forbidden:**
```json
{
  "message": "Forbidden: You can only delete your own posts",
  "error": "..."
}
```

**404 Not Found:**
```json
{
  "message": "Post not found",
  "error": "..."
}
```

**409 Conflict:**
```json
{
  "message": "You have already liked this post",
  "error": "..."
}
```

**500 Internal Server Error:**
```json
{
  "message": "Failed to create post",
  "error": "..."
}
```

## File Structure

```
posts/
├── create.ts          # POST /posts
├── get.ts             # GET /posts/:postId
├── list.ts            # GET /posts
├── update.ts          # PUT /posts/:postId
├── delete.ts          # DELETE /posts/:postId
├── like.ts            # POST /posts/:postId/like
├── unlike.ts          # DELETE /posts/:postId/like
├── add-comment.ts     # POST /posts/:postId/comments
├── get-comments.ts    # GET /posts/:postId/comments
├── delete-comment.ts  # DELETE /posts/:postId/comments/:commentId
├── utils.ts           # Shared utilities
├── index.ts           # Exports
└── README.md          # This file
```

## Data Consistency

All handlers use composite operations from `apps/be/src/database/operations.ts` to ensure data consistency:

- **Creating a post** → Increments user's `postCount`
- **Deleting a post** → Decrements user's `postCount`
- **Liking a post** → Creates like + increments post's `likeCount`
- **Unliking a post** → Deletes like + decrements post's `likeCount`
- **Adding a comment** → Creates comment + increments post's `commentCount`
- **Deleting a comment** → Deletes comment + decrements post's `commentCount`

## Integration with Database Layer

These handlers use the following database functions:

**From `apps/be/src/database/post.ts`:**
- `createPost()`
- `getPostById()`
- `getPostsByUser()`
- `getGlobalFeed()`
- `updatePost()`
- `deletePost()`

**From `apps/be/src/database/operations.ts`:**
- `likePost()` - Ensures like + count update
- `unlikePost()` - Ensures unlike + count update
- `addComment()` - Ensures comment + count update
- `removeComment()` - Ensures delete + count update

**From `apps/be/src/database/user.ts`:**
- `incrementPostCount()`

**From `apps/be/src/database/comment.ts`:**
- `getCommentsByPost()`

## Environment Variables

No additional environment variables needed. The handlers rely on the database layer which uses:
- `TABLE_NAME` - DynamoDB table name (default: "SocialMediaApp")
- `AWS_REGION` - AWS region (default: "us-east-1")

## Example Usage

### Create and like a post
```bash
# Create post
curl -X POST https://api.example.com/posts \
  -H "x-user-id: user123" \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/photo.jpg",
    "caption": "Beautiful sunset!"
  }'

# Like the post
curl -X POST https://api.example.com/posts/{postId}/like \
  -H "x-user-id: user456"

# Add a comment
curl -X POST https://api.example.com/posts/{postId}/comments \
  -H "x-user-id: user789" \
  -H "Content-Type: application/json" \
  -d '{"content": "Amazing photo!"}'
```

### Get posts with pagination
```bash
# First page
curl "https://api.example.com/posts?userId=user123&limit=10"

# Next page (using lastEvaluatedKey from previous response)
curl "https://api.example.com/posts?userId=user123&limit=10&lastEvaluatedKey=..."
```

## Testing

When testing locally, you can set the user ID via header:
```typescript
const event = {
  headers: {
    'x-user-id': 'test-user-123'
  },
  // ... rest of event
};
```

## Future Enhancements

- [ ] Update comment endpoint
- [ ] Get likes for a post with user details
- [ ] Batch operations for better performance
- [ ] Real-time notifications for likes/comments
- [ ] Rich text support for captions/comments
- [ ] Media validation and processing
