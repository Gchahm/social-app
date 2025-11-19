# Database Access Layer

This directory contains the complete data access layer for the social media application using DynamoDB single-table design pattern.

## Overview

The data access layer provides a clean, type-safe interface for interacting with DynamoDB. It abstracts away the complexity of the single-table design and provides intuitive methods for CRUD operations on all entities.

## Architecture

### Single-Table Design

All entities (Users, Posts, Likes, Comments, Follows) are stored in a single DynamoDB table with the following structure:

- **Primary Keys**: `PK` (Partition Key) and `SK` (Sort Key)
- **Global Secondary Indexes**:
  - `GSI1`: User-Entity Index (queries by user)
  - `GSI2`: Email/Username Lookup
  - `GSI3`: Feed Index (global feed)

See `.docs/database-erd.md` for detailed design documentation.

## File Structure

```
database/
├── types.ts          # TypeScript type definitions
├── client.ts         # DynamoDB client configuration
├── keys.ts           # Key builder utilities
├── user.ts           # User entity operations
├── post.ts           # Post entity operations
├── like.ts           # Like entity operations
├── comment.ts        # Comment entity operations
├── follow.ts         # Follow entity operations
├── operations.ts     # Composite operations (recommended)
├── index.ts          # Main exports
└── README.md         # This file
```

## Environment Variables

Set these environment variables:

```bash
TABLE_NAME=SocialMediaApp    # DynamoDB table name
AWS_REGION=us-east-1         # AWS region
```

## Usage Examples

### User Operations

```typescript
import {
  createUser,
  getUserById,
  getUserByUsername,
  getUserByEmail,
  updateUser,
} from './database';

// Create a new user
const user = await createUser({
  userId: 'user123',
  email: 'john@example.com',
  username: 'johndoe',
  displayName: 'John Doe',
  bio: 'Software developer',
});

// Get user by ID
const user = await getUserById('user123');

// Get user by username
const user = await getUserByUsername('johndoe');

// Get user by email
const user = await getUserByEmail('john@example.com');

// Update user profile
const updatedUser = await updateUser({
  userId: 'user123',
  displayName: 'John Smith',
  bio: 'Full-stack developer',
});
```

### Post Operations

```typescript
import {
  createPost,
  getPostById,
  getPostsByUser,
  getGlobalFeed,
  updatePost,
} from './database';

// Create a new post
const post = await createPost({
  postId: 'post123',
  userId: 'user123',
  imageUrl: 'https://example.com/image.jpg',
  caption: 'Beautiful sunset!',
});

// Get post by ID
const post = await getPostById('post123');

// Get all posts by a user (with pagination)
const { items: posts, lastEvaluatedKey } = await getPostsByUser('user123', {
  limit: 20,
});

// Get global feed
const { items: feedPosts } = await getGlobalFeed({ limit: 20 });

// Update post caption
const updatedPost = await updatePost({
  postId: 'post123',
  caption: 'Amazing sunset!',
});
```

### Like Operations (Use Composite Operations)

**Recommended: Use composite operations** to ensure data consistency:

```typescript
import { likePost, unlikePost } from './database';

// Like a post (creates like + updates post like count)
await likePost({
  postId: 'post123',
  userId: 'user456',
});

// Unlike a post (removes like + updates post like count)
await unlikePost('post123', 'user456');
```

**Low-level operations** (use only if you know what you're doing):

```typescript
import {
  createLike,
  checkUserLikedPost,
  getLikesByPost,
  getLikesByUser,
} from './database';

// Check if user liked a post
const isLiked = await checkUserLikedPost('post123', 'user456');

// Get all likes for a post
const { items: likes } = await getLikesByPost('post123');

// Get all posts a user liked
const { items: likedPosts } = await getLikesByUser('user456');
```

### Comment Operations (Use Composite Operations)

**Recommended: Use composite operations**:

```typescript
import { addComment, removeComment } from './database';

// Add a comment (creates comment + updates post comment count)
await addComment({
  commentId: 'comment123',
  postId: 'post123',
  userId: 'user456',
  content: 'Great photo!',
});

// Remove a comment (deletes comment + updates post comment count)
await removeComment('post123', 'comment123');
```

**Low-level operations**:

```typescript
import {
  getCommentsByPost,
  getCommentsByUser,
  updateComment,
} from './database';

// Get all comments for a post
const { items: comments } = await getCommentsByPost('post123', { limit: 20 });

// Get all comments by a user
const { items: userComments } = await getCommentsByUser('user456');

// Update a comment
const updatedComment = await updateComment({
  commentId: 'comment123',
  postId: 'post123',
  content: 'Updated comment text',
});
```

### Follow Operations (Use Composite Operations)

**Recommended: Use composite operations**:

```typescript
import { followUser, unfollowUser } from './database';

// Follow a user (creates follow + updates follower/following counts)
await followUser({
  followerId: 'user123',
  followingId: 'user456',
});

// Unfollow a user (removes follow + updates follower/following counts)
await unfollowUser('user123', 'user456');
```

**Low-level operations**:

```typescript
import {
  checkIsFollowing,
  getFollowing,
  getFollowers,
} from './database';

// Check if userA follows userB
const isFollowing = await checkIsFollowing('user123', 'user456');

// Get all users that user123 follows
const { items: following } = await getFollowing('user123');

// Get all followers of user456
const { items: followers } = await getFollowers('user456');
```

## Pagination

All query operations support pagination:

```typescript
// First page
const { items, lastEvaluatedKey } = await getPostsByUser('user123', {
  limit: 20,
});

// Next page
if (lastEvaluatedKey) {
  const { items: nextPage } = await getPostsByUser('user123', {
    limit: 20,
    lastEvaluatedKey,
  });
}
```

## Error Handling

The data access layer throws errors for common validation issues:

```typescript
try {
  await likePost({ postId: 'post123', userId: 'user456' });
} catch (error) {
  if (error.message === 'Post already liked by user') {
    // Handle duplicate like
  }
}

try {
  await followUser({ followerId: 'user123', followingId: 'user123' });
} catch (error) {
  if (error.message === 'Cannot follow yourself') {
    // Handle self-follow attempt
  }
}
```

## Best Practices

1. **Use Composite Operations**: Always use `likePost`, `unlikePost`, `addComment`, `removeComment`, `followUser`, and `unfollowUser` instead of low-level operations to ensure data consistency.

2. **Handle Pagination**: For large result sets, always implement pagination using `lastEvaluatedKey`.

3. **Error Handling**: Wrap database operations in try-catch blocks and handle common errors gracefully.

4. **Type Safety**: Use TypeScript types exported from `types.ts` for type safety.

5. **Denormalized Counts**: The following counts are automatically maintained:
   - `user.followerCount`, `user.followingCount`, `user.postCount`
   - `post.likeCount`, `post.commentCount`

6. **Conditional Expressions**: The layer uses DynamoDB condition expressions to prevent:
   - Duplicate users (same userId)
   - Duplicate likes
   - Duplicate follows
   - Self-follows

## Data Consistency

The composite operations in `operations.ts` ensure data consistency across related entities:

- **likePost/unlikePost**: Updates both the Like entity and Post's `likeCount`
- **addComment/removeComment**: Updates both the Comment entity and Post's `commentCount`
- **followUser/unfollowUser**: Updates both the Follow entity and User's `followerCount`/`followingCount`

## Advanced Patterns

### User Feed (Posts from Followed Users)

```typescript
import { getFollowing, getPostsByUser } from './database';

async function getUserFeed(userId: string) {
  // Get all users the current user follows
  const { items: following } = await getFollowing(userId);

  // Fetch posts from each followed user
  const postPromises = following.map((follow) =>
    getPostsByUser(follow.followingId, { limit: 10 })
  );

  const results = await Promise.all(postPromises);
  const allPosts = results.flatMap((r) => r.items);

  // Sort by timestamp (newest first)
  return allPosts.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
```

### Batch Operations

For batch operations, use the underlying `BatchWriteCommand` or `BatchGetCommand` from `client.ts`:

```typescript
import { docClient, TABLE_NAME, BatchGetCommand } from './database/client';

// Batch get multiple users
const response = await docClient.send(
  new BatchGetCommand({
    RequestItems: {
      [TABLE_NAME]: {
        Keys: [
          { PK: 'USER#user1', SK: 'PROFILE' },
          { PK: 'USER#user2', SK: 'PROFILE' },
          { PK: 'USER#user3', SK: 'PROFILE' },
        ],
      },
    },
  })
);
```

## Testing

When testing, you can override the `TABLE_NAME` environment variable:

```typescript
process.env.TABLE_NAME = 'SocialMediaApp-Test';
```

## Performance Considerations

- **Hot Partitions**: Popular posts may create hot partitions. Consider implementing caching for viral content.
- **Eventually Consistent Reads**: GSI reads are eventually consistent. Use base table queries for strongly consistent reads when needed.
- **Item Size**: DynamoDB items are limited to 400KB. Store large images in S3 and only save URLs in DynamoDB.

## Future Enhancements

- DynamoDB Streams integration for real-time updates
- Caching layer with Redis/ElastiCache
- Full-text search with OpenSearch
- Analytics with DynamoDB Streams + Lambda
