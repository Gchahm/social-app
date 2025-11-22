/**
 * Composite operations that combine multiple entity updates
 * These ensure data consistency across related entities
 */

import { createLike, deleteLike, checkUserLikedPost } from './like';
import { incrementLikeCount } from './post';
import { createComment, deleteCommentById } from './comment';
import { incrementCommentCount } from './post';
import { createFollow, deleteFollow, checkIsFollowing } from './follow';
import { incrementFollowerCount, incrementFollowingCount } from './user';
import type {
  CreateLikeInput,
  CreateCommentInput,
  CreateFollowInput,
} from './types';

/**
 * Like a post (creates like + updates post like count)
 */
export async function likePost(input: CreateLikeInput): Promise<void> {
  // Check if already liked
  const alreadyLiked = await checkUserLikedPost(input.postId, input.userId);
  if (alreadyLiked) {
    throw new Error('Post already liked by user');
  }

  // Create like entity
  await createLike(input);

  // Increment post like count
  await incrementLikeCount(input.postId, 1);
}

/**
 * Unlike a post (removes like + updates post like count)
 */
export async function unlikePost(
  postId: string,
  userId: string
): Promise<void> {
  // Check if actually liked
  const isLiked = await checkUserLikedPost(postId, userId);
  if (!isLiked) {
    throw new Error('Post not liked by user');
  }

  // Delete like entity
  await deleteLike(postId, userId);

  // Decrement post like count
  await incrementLikeCount(postId, -1);
}

/**
 * Add a comment to a post (creates comment + updates post comment count)
 */
export async function addComment(input: CreateCommentInput): Promise<void> {
  // Create comment entity
  await createComment(input);

  // Increment post comment count
  await incrementCommentCount(input.postId, 1);
}

/**
 * Remove a comment from a post (deletes comment + updates post comment count)
 */
export async function removeComment(
  postId: string,
  commentId: string
): Promise<void> {
  // Delete comment entity
  const deleted = await deleteCommentById(postId, commentId);

  if (deleted) {
    // Decrement post comment count
    await incrementCommentCount(postId, -1);
  }
}

/**
 * Follow a user (creates follow + updates follower/following counts)
 */
export async function followUser(input: CreateFollowInput): Promise<void> {
  // Check if already following
  const alreadyFollowing = await checkIsFollowing(
    input.followerId,
    input.followingId
  );
  if (alreadyFollowing) {
    throw new Error('Already following user');
  }

  // Prevent self-follow
  if (input.followerId === input.followingId) {
    throw new Error('Cannot follow yourself');
  }

  // Create follow entity
  await createFollow(input);

  // Increment follower count for the user being followed
  await incrementFollowerCount(input.followingId, 1);

  // Increment following count for the user who follows
  await incrementFollowingCount(input.followerId, 1);
}

/**
 * Unfollow a user (removes follow + updates follower/following counts)
 */
export async function unfollowUser(
  followerId: string,
  followingId: string
): Promise<void> {
  // Check if actually following
  const isFollowing = await checkIsFollowing(followerId, followingId);
  if (!isFollowing) {
    throw new Error('Not following user');
  }

  // Delete follow entity
  await deleteFollow(followerId, followingId);

  // Decrement follower count for the user being unfollowed
  await incrementFollowerCount(followingId, -1);

  // Decrement following count for the user who unfollows
  await incrementFollowingCount(followerId, -1);
}
