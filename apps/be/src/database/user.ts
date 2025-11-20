import {
  docClient,
  TABLE_NAME,
  GSI1_NAME,
  GSI2_NAME,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  dynamoDBClient,
} from './client';
import { userKeys, generateTimestamp } from "./keys";
import type { UserEntity, CreateUserInput, UpdateUserInput } from "./types";

/**
 * Create a new user
 */
export async function createUser(input: CreateUserInput): Promise<UserEntity> {
  const timestamp = generateTimestamp();

  const user: UserEntity = {
    ...input,
    PK: userKeys.pk(input.userId),
    SK: userKeys.sk(),
    GSI1PK: userKeys.gsi1pk(input.username),
    GSI1SK: userKeys.gsi1sk(),
    GSI2PK: userKeys.gsi2pk(input.email),
    GSI2SK: userKeys.gsi2sk(),
    entityType: "USER",
    followerCount: 0,
    followingCount: 0,
    postCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await dynamoDBClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: user,
      ConditionExpression: "attribute_not_exists(PK)",
    })
  );

  return user;
}

/**
 * Get user by userId
 */
export async function getUserById(userId: string): Promise<UserEntity | null> {
  const response = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: userKeys.pk(userId),
        SK: userKeys.sk(),
      },
    })
  );

  return (response.Item as UserEntity) || null;
}

/**
 * Get user by username
 */
export async function getUserByUsername(
  username: string
): Promise<UserEntity | null> {
  const response = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: GSI1_NAME,
      KeyConditionExpression: "GSI1PK = :gsi1pk",
      ExpressionAttributeValues: {
        ":gsi1pk": userKeys.gsi1pk(username),
      },
      Limit: 1,
    })
  );

  return (response.Items?.[0] as UserEntity) || null;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<UserEntity | null> {
  const response = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: GSI2_NAME,
      KeyConditionExpression: "GSI2PK = :gsi2pk",
      ExpressionAttributeValues: {
        ":gsi2pk": userKeys.gsi2pk(email),
      },
      Limit: 1,
    })
  );

  return (response.Items?.[0] as UserEntity) || null;
}

/**
 * Batch get users by their IDs
 * Returns a Map of userId -> UserEntity for efficient lookup
 * More efficient than querying each user individually
 *
 * @throws Error if userIds.length > 100
 */
export async function getUsersByIds(
  userIds: string[]
): Promise<Map<string, UserEntity>> {
  if (userIds.length === 0) {
    return new Map();
  }

  // Enforce maximum batch size to prevent excessive queries
  if (userIds.length > 100) {
    throw new Error(
      `getUsersByIds: Cannot fetch more than 100 users at once. Received ${userIds.length} users.`
    );
  }

  // Remove duplicates
  const uniqueUserIds = [...new Set(userIds)];

  const { BatchGetCommand } = await import("@aws-sdk/lib-dynamodb");

  const response = await docClient.send(
    new BatchGetCommand({
      RequestItems: {
        [TABLE_NAME]: {
          Keys: uniqueUserIds.map(userId => ({
            PK: userKeys.pk(userId),
            SK: userKeys.sk(),
          })),
        },
      },
    })
  );

  // Build a map for efficient lookup
  const userMap = new Map<string, UserEntity>();
  const items = response.Responses?.[TABLE_NAME] as UserEntity[] || [];

  items.forEach(user => {
    userMap.set(user.userId, user);
  });

  return userMap;
}

/**
 * Update user profile
 */
export async function updateUser(
  input: UpdateUserInput
): Promise<UserEntity | null> {
  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};

  // Build update expression dynamically
  if (input.displayName !== undefined) {
    updateExpressions.push("#displayName = :displayName");
    expressionAttributeNames["#displayName"] = "displayName";
    expressionAttributeValues[":displayName"] = input.displayName;
  }

  if (input.profileImageUrl !== undefined) {
    updateExpressions.push("#profileImageUrl = :profileImageUrl");
    expressionAttributeNames["#profileImageUrl"] = "profileImageUrl";
    expressionAttributeValues[":profileImageUrl"] = input.profileImageUrl;
  }

  if (input.bio !== undefined) {
    updateExpressions.push("#bio = :bio");
    expressionAttributeNames["#bio"] = "bio";
    expressionAttributeValues[":bio"] = input.bio;
  }

  // Always update the updatedAt timestamp
  updateExpressions.push("#updatedAt = :updatedAt");
  expressionAttributeNames["#updatedAt"] = "updatedAt";
  expressionAttributeValues[":updatedAt"] = generateTimestamp();

  if (updateExpressions.length === 1) {
    // Only updatedAt, no actual updates
    return getUserById(input.userId);
  }

  const response = await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: userKeys.pk(input.userId),
        SK: userKeys.sk(),
      },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ConditionExpression: "attribute_exists(PK)",
      ReturnValues: "ALL_NEW",
    })
  );

  return (response.Attributes as UserEntity) || null;
}

/**
 * Delete user
 */
export async function deleteUser(userId: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: userKeys.pk(userId),
        SK: userKeys.sk(),
      },
    })
  );
}

/**
 * Increment user follower count
 */
export async function incrementFollowerCount(
  userId: string,
  increment: number = 1
): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: userKeys.pk(userId),
        SK: userKeys.sk(),
      },
      UpdateExpression:
        "SET followerCount = if_not_exists(followerCount, :zero) + :inc, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":inc": increment,
        ":zero": 0,
        ":updatedAt": generateTimestamp(),
      },
    })
  );
}

/**
 * Increment user following count
 */
export async function incrementFollowingCount(
  userId: string,
  increment: number = 1
): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: userKeys.pk(userId),
        SK: userKeys.sk(),
      },
      UpdateExpression:
        "SET followingCount = if_not_exists(followingCount, :zero) + :inc, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":inc": increment,
        ":zero": 0,
        ":updatedAt": generateTimestamp(),
      },
    })
  );
}

/**
 * Increment user post count
 */
export async function incrementPostCount(
  userId: string,
  increment: number = 1
): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: userKeys.pk(userId),
        SK: userKeys.sk(),
      },
      UpdateExpression:
        "SET postCount = if_not_exists(postCount, :zero) + :inc, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":inc": increment,
        ":zero": 0,
        ":updatedAt": generateTimestamp(),
      },
    })
  );
}
