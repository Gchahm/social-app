/**
 * Database Access Layer - Single Table Design
 *
 * This module provides a complete data access layer for the social media application
 * using DynamoDB single-table design pattern.
 *
 * @example
 * ```typescript
 * import { createUser, getUserById } from './database';
 *
 * // Create a new user
 * const user = await createUser({
 *   userId: 'user123',
 *   email: 'user@example.com',
 *   username: 'johndoe',
 *   displayName: 'John Doe'
 * });
 *
 * // Get user by ID
 * const user = await getUserById('user123');
 * ```
 */

// Types
export * from "./types";

// Client configuration
export { TABLE_NAME, GSI1_NAME, GSI2_NAME, GSI3_NAME } from "./client";

// Key builders
export * from "./keys";

// User operations
export {
  createUser,
  getUserById,
  getUserByUsername,
  getUserByEmail,
  updateUser,
  deleteUser,
  incrementFollowerCount,
  incrementFollowingCount,
  incrementPostCount,
} from "./user";

// Post operations
export {
  createPost,
  getPostById,
  getPostsByUser,
  getGlobalFeed,
  updatePost,
  deletePost,
  incrementLikeCount,
  incrementCommentCount,
} from "./post";

// Like operations
export {
  createLike,
  checkUserLikedPost,
  getLike,
  getLikesByPost,
  getLikesByUser,
  deleteLike,
} from "./like";

// Comment operations
export {
  createComment,
  getCommentsByPost,
  getCommentsByUser,
  getComment,
  updateComment,
  deleteComment,
  deleteCommentById,
} from "./comment";

// Follow operations
export {
  createFollow,
  checkIsFollowing,
  getFollow,
  getFollowing,
  getFollowers,
  deleteFollow,
} from "./follow";

// Composite operations (recommended for consistency)
export {
  likePost,
  unlikePost,
  addComment,
  removeComment,
  followUser,
  unfollowUser,
} from "./operations";
