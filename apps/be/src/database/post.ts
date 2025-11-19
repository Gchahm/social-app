import {
  docClient,
  TABLE_NAME,
  GSI1_NAME,
  GSI3_NAME,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
} from "./client";
import { postKeys, generateTimestamp } from "./keys";
import type {
  PostEntity,
  CreatePostInput,
  UpdatePostInput,
  QueryResult,
  PaginationOptions,
} from "./types";

/**
 * Create a new post
 */
export async function createPost(input: CreatePostInput): Promise<PostEntity> {
  const timestamp = generateTimestamp();

  const post: PostEntity = {
    ...input,
    PK: postKeys.pk(input.postId),
    SK: postKeys.sk(),
    GSI1PK: postKeys.gsi1pk(input.userId),
    GSI1SK: postKeys.gsi1sk(timestamp),
    GSI3PK: postKeys.gsi3pk(),
    GSI3SK: postKeys.gsi3sk(timestamp),
    entityType: "POST",
    likeCount: 0,
    commentCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: post,
      ConditionExpression: "attribute_not_exists(PK)",
    })
  );

  return post;
}

/**
 * Get post by postId
 */
export async function getPostById(postId: string): Promise<PostEntity | null> {
  const response = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: postKeys.pk(postId),
        SK: postKeys.sk(),
      },
    })
  );

  return (response.Item as PostEntity) || null;
}

/**
 * Get all posts by a user (sorted by newest first)
 */
export async function getPostsByUser(
  userId: string,
  options: PaginationOptions = {}
): Promise<QueryResult<PostEntity>> {
  const { limit = 20, lastEvaluatedKey } = options;

  const response = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: GSI1_NAME,
      KeyConditionExpression:
        "GSI1PK = :gsi1pk AND begins_with(GSI1SK, :prefix)",
      ExpressionAttributeValues: {
        ":gsi1pk": postKeys.gsi1pk(userId),
        ":prefix": "POST#",
      },
      ScanIndexForward: false, // newest first
      Limit: limit,
      ExclusiveStartKey: lastEvaluatedKey,
    })
  );

  return {
    items: (response.Items as PostEntity[]) || [],
    lastEvaluatedKey: response.LastEvaluatedKey,
  };
}

/**
 * Get global feed (all posts sorted by newest first)
 */
export async function getGlobalFeed(
  options: PaginationOptions = {}
): Promise<QueryResult<PostEntity>> {
  const { limit = 20, lastEvaluatedKey } = options;

  const response = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: GSI3_NAME,
      KeyConditionExpression:
        "GSI3PK = :gsi3pk AND begins_with(GSI3SK, :prefix)",
      ExpressionAttributeValues: {
        ":gsi3pk": postKeys.gsi3pk(),
        ":prefix": "POST#",
      },
      ScanIndexForward: false, // newest first
      Limit: limit,
      ExclusiveStartKey: lastEvaluatedKey,
    })
  );

  return {
    items: (response.Items as PostEntity[]) || [],
    lastEvaluatedKey: response.LastEvaluatedKey,
  };
}

/**
 * Update post caption
 */
export async function updatePost(
  input: UpdatePostInput
): Promise<PostEntity | null> {
  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};

  if (input.caption !== undefined) {
    updateExpressions.push("#caption = :caption");
    expressionAttributeNames["#caption"] = "caption";
    expressionAttributeValues[":caption"] = input.caption;
  }

  // Always update the updatedAt timestamp
  updateExpressions.push("#updatedAt = :updatedAt");
  expressionAttributeNames["#updatedAt"] = "updatedAt";
  expressionAttributeValues[":updatedAt"] = generateTimestamp();

  if (updateExpressions.length === 1) {
    // Only updatedAt, no actual updates
    return getPostById(input.postId);
  }

  const response = await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: postKeys.pk(input.postId),
        SK: postKeys.sk(),
      },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ConditionExpression: "attribute_exists(PK)",
      ReturnValues: "ALL_NEW",
    })
  );

  return (response.Attributes as PostEntity) || null;
}

/**
 * Delete post
 */
export async function deletePost(postId: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: postKeys.pk(postId),
        SK: postKeys.sk(),
      },
    })
  );
}

/**
 * Increment post like count
 */
export async function incrementLikeCount(
  postId: string,
  increment: number = 1
): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: postKeys.pk(postId),
        SK: postKeys.sk(),
      },
      UpdateExpression:
        "SET likeCount = if_not_exists(likeCount, :zero) + :inc, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":inc": increment,
        ":zero": 0,
        ":updatedAt": generateTimestamp(),
      },
    })
  );
}

/**
 * Increment post comment count
 */
export async function incrementCommentCount(
  postId: string,
  increment: number = 1
): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: postKeys.pk(postId),
        SK: postKeys.sk(),
      },
      UpdateExpression:
        "SET commentCount = if_not_exists(commentCount, :zero) + :inc, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":inc": increment,
        ":zero": 0,
        ":updatedAt": generateTimestamp(),
      },
    })
  );
}
