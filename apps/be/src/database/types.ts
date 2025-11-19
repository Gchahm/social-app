/**
 * Database entity types and interfaces
 */

export type EntityType = "USER" | "POST" | "LIKE" | "COMMENT" | "FOLLOW";

/**
 * Base DynamoDB item structure
 */
export interface BaseItem {
  PK: string;
  SK: string;
  GSI1PK?: string;
  GSI1SK?: string;
  GSI2PK?: string;
  GSI2SK?: string;
  GSI3PK?: string;
  GSI3SK?: string;
  entityType: EntityType;
  createdAt: string;
  updatedAt?: string;
}

/**
 * User entity
 */
export interface UserEntity extends BaseItem {
  entityType: "USER";
  userId: string;
  email: string;
  username: string;
  displayName: string;
  profileImageUrl?: string;
  bio?: string;
  followerCount: number;
  followingCount: number;
  postCount: number;
}

/**
 * Post entity
 */
export interface PostEntity extends BaseItem {
  entityType: "POST";
  postId: string;
  userId: string;
  imageUrl: string;
  caption?: string;
  likeCount: number;
  commentCount: number;
}

/**
 * Like entity
 */
export interface LikeEntity extends BaseItem {
  entityType: "LIKE";
  postId: string;
  userId: string;
}

/**
 * Comment entity
 */
export interface CommentEntity extends BaseItem {
  entityType: "COMMENT";
  commentId: string;
  postId: string;
  userId: string;
  content: string;
}

/**
 * Follow entity
 */
export interface FollowEntity extends BaseItem {
  entityType: "FOLLOW";
  followerId: string;
  followingId: string;
}

/**
 * Input types for creating entities (without system-generated fields)
 */
export interface CreateUserInput {
  userId: string;
  email: string;
  username: string;
  displayName: string;
  profileImageUrl?: string;
  bio?: string;
}

export interface CreatePostInput {
  postId: string;
  userId: string;
  imageUrl: string;
  caption?: string;
}

export interface CreateLikeInput {
  postId: string;
  userId: string;
}

export interface CreateCommentInput {
  commentId: string;
  postId: string;
  userId: string;
  content: string;
}

export interface CreateFollowInput {
  followerId: string;
  followingId: string;
}

/**
 * Update types for entities
 */
export interface UpdateUserInput {
  userId: string;
  displayName?: string;
  profileImageUrl?: string;
  bio?: string;
}

export interface UpdatePostInput {
  postId: string;
  caption?: string;
}

export interface UpdateCommentInput {
  commentId: string;
  postId: string;
  content: string;
}

/**
 * Query result with pagination
 */
export interface QueryResult<T> {
  items: T[];
  lastEvaluatedKey?: Record<string, any>;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  limit?: number;
  lastEvaluatedKey?: Record<string, any>;
}
