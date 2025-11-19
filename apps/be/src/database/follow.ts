import {
  docClient,
  TABLE_NAME,
  GSI1_NAME,
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
} from "./client";
import { followKeys, generateTimestamp } from "./keys";
import type {
  FollowEntity,
  CreateFollowInput,
  QueryResult,
  PaginationOptions,
} from "./types";

/**
 * Create a new follow relationship (with duplicate prevention)
 */
export async function createFollow(
  input: CreateFollowInput
): Promise<FollowEntity> {
  const timestamp = generateTimestamp();

  const follow: FollowEntity = {
    ...input,
    PK: followKeys.pk(input.followerId),
    SK: followKeys.sk(input.followingId),
    GSI1PK: followKeys.gsi1pk(input.followingId),
    GSI1SK: followKeys.gsi1sk(input.followerId),
    entityType: "FOLLOW",
    createdAt: timestamp,
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: follow,
      ConditionExpression: "attribute_not_exists(PK)",
    })
  );

  return follow;
}

/**
 * Check if userA follows userB
 */
export async function checkIsFollowing(
  followerId: string,
  followingId: string
): Promise<boolean> {
  const response = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: followKeys.pk(followerId),
        SK: followKeys.sk(followingId),
      },
    })
  );

  return !!response.Item;
}

/**
 * Get follow relationship
 */
export async function getFollow(
  followerId: string,
  followingId: string
): Promise<FollowEntity | null> {
  const response = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: followKeys.pk(followerId),
        SK: followKeys.sk(followingId),
      },
    })
  );

  return (response.Item as FollowEntity) || null;
}

/**
 * Get all users that a user follows (following list)
 */
export async function getFollowing(
  userId: string,
  options: PaginationOptions = {}
): Promise<QueryResult<FollowEntity>> {
  const { limit = 50, lastEvaluatedKey } = options;

  const response = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: {
        ":pk": followKeys.pk(userId),
        ":prefix": followKeys.followingPrefix(),
      },
      Limit: limit,
      ExclusiveStartKey: lastEvaluatedKey,
    })
  );

  return {
    items: (response.Items as FollowEntity[]) || [],
    lastEvaluatedKey: response.LastEvaluatedKey,
  };
}

/**
 * Get all followers of a user (followers list)
 */
export async function getFollowers(
  userId: string,
  options: PaginationOptions = {}
): Promise<QueryResult<FollowEntity>> {
  const { limit = 50, lastEvaluatedKey } = options;

  const response = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: GSI1_NAME,
      KeyConditionExpression:
        "GSI1PK = :gsi1pk AND begins_with(GSI1SK, :prefix)",
      ExpressionAttributeValues: {
        ":gsi1pk": followKeys.gsi1pk(userId),
        ":prefix": followKeys.followerPrefix(),
      },
      Limit: limit,
      ExclusiveStartKey: lastEvaluatedKey,
    })
  );

  return {
    items: (response.Items as FollowEntity[]) || [],
    lastEvaluatedKey: response.LastEvaluatedKey,
  };
}

/**
 * Unfollow a user
 */
export async function deleteFollow(
  followerId: string,
  followingId: string
): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: followKeys.pk(followerId),
        SK: followKeys.sk(followingId),
      },
    })
  );
}
