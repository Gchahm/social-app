/**
 * Key builder utilities for DynamoDB single-table design
 */

/**
 * User keys
 */
export const userKeys = {
  pk: (userId: string) => `USER#${userId}`,
  sk: () => "PROFILE",
  gsi1pk: (username: string) => `USERNAME#${username}`,
  gsi1sk: () => "USER",
  gsi2pk: (email: string) => `EMAIL#${email}`,
  gsi2sk: () => "USER",
};

/**
 * Post keys
 */
export const postKeys = {
  pk: (postId: string) => `POST#${postId}`,
  sk: () => "METADATA",
  gsi1pk: (userId: string) => `USER#${userId}`,
  gsi1sk: (timestamp: string) => `POST#${timestamp}`,
  gsi3pk: () => "FEED",
  gsi3sk: (timestamp: string) => `POST#${timestamp}`,
};

/**
 * Like keys
 */
export const likeKeys = {
  pk: (postId: string) => `POST#${postId}`,
  sk: (userId: string) => `LIKE#${userId}`,
  gsi1pk: (userId: string) => `USER#${userId}`,
  gsi1sk: (timestamp: string, postId: string) => `LIKE#${timestamp}#${postId}`,
};

/**
 * Comment keys
 */
export const commentKeys = {
  pk: (postId: string) => `POST#${postId}`,
  sk: (timestamp: string, commentId: string) => `COMMENT#${timestamp}#${commentId}`,
  gsi1pk: (userId: string) => `USER#${userId}`,
  gsi1sk: (timestamp: string, postId: string) => `COMMENT#${timestamp}#${postId}`,
  skPrefix: () => "COMMENT#",
};

/**
 * Follow keys
 */
export const followKeys = {
  pk: (followerId: string) => `USER#${followerId}`,
  sk: (followingId: string) => `FOLLOWING#${followingId}`,
  gsi1pk: (followingId: string) => `USER#${followingId}`,
  gsi1sk: (followerId: string) => `FOLLOWER#${followerId}`,
  followingPrefix: () => "FOLLOWING#",
  followerPrefix: () => "FOLLOWER#",
};

/**
 * Utility function to generate ISO timestamp
 */
export const generateTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * Utility function to parse timestamp from sort key
 */
export const parseTimestampFromSK = (sk: string): string | null => {
  const parts = sk.split("#");
  if (parts.length >= 2) {
    return parts[1];
  }
  return null;
};
