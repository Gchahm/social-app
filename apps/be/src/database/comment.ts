import {
  docClient,
  TABLE_NAME,
  GSI1_NAME,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
} from "./client";
import { commentKeys, generateTimestamp } from "./keys";
import type {
  CommentEntity,
  CreateCommentInput,
  UpdateCommentInput,
  QueryResult,
  PaginationOptions,
} from "./types";

/**
 * Create a new comment
 */
export async function createComment(
  input: CreateCommentInput
): Promise<CommentEntity> {
  const timestamp = generateTimestamp();

  const comment: CommentEntity = {
    ...input,
    PK: commentKeys.pk(input.postId),
    SK: commentKeys.sk(timestamp, input.commentId),
    GSI1PK: commentKeys.gsi1pk(input.userId),
    GSI1SK: commentKeys.gsi1sk(timestamp, input.postId),
    entityType: "COMMENT",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: comment,
    })
  );

  return comment;
}

/**
 * Get all comments for a post (sorted chronologically)
 */
export async function getCommentsByPost(
  postId: string,
  options: PaginationOptions = {}
): Promise<QueryResult<CommentEntity>> {
  const { limit = 20, lastEvaluatedKey } = options;

  const response = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: {
        ":pk": commentKeys.pk(postId),
        ":prefix": commentKeys.skPrefix(),
      },
      ScanIndexForward: true, // oldest first (chronological order)
      Limit: limit,
      ExclusiveStartKey: lastEvaluatedKey,
    })
  );

  return {
    items: (response.Items as CommentEntity[]) || [],
    lastEvaluatedKey: response.LastEvaluatedKey,
  };
}

/**
 * Get all comments by a user
 */
export async function getCommentsByUser(
  userId: string,
  options: PaginationOptions = {}
): Promise<QueryResult<CommentEntity>> {
  const { limit = 20, lastEvaluatedKey } = options;

  const response = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: GSI1_NAME,
      KeyConditionExpression:
        "GSI1PK = :gsi1pk AND begins_with(GSI1SK, :prefix)",
      ExpressionAttributeValues: {
        ":gsi1pk": commentKeys.gsi1pk(userId),
        ":prefix": "COMMENT#",
      },
      ScanIndexForward: false, // newest first
      Limit: limit,
      ExclusiveStartKey: lastEvaluatedKey,
    })
  );

  return {
    items: (response.Items as CommentEntity[]) || [],
    lastEvaluatedKey: response.LastEvaluatedKey,
  };
}

/**
 * Get a specific comment
 */
export async function getComment(
  postId: string,
  timestamp: string,
  commentId: string
): Promise<CommentEntity | null> {
  const response = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: commentKeys.pk(postId),
        SK: commentKeys.sk(timestamp, commentId),
      },
    })
  );

  return (response.Item as CommentEntity) || null;
}

/**
 * Update comment content
 */
export async function updateComment(
  input: UpdateCommentInput
): Promise<CommentEntity | null> {
  // We need to query to find the comment first since we need the timestamp
  const commentsResult = await getCommentsByPost(input.postId, { limit: 100 });
  const comment = commentsResult.items.find(
    (c) => c.commentId === input.commentId
  );

  if (!comment) {
    return null;
  }

  const response = await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: comment.PK,
        SK: comment.SK,
      },
      UpdateExpression: "SET #content = :content, #updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#content": "content",
        "#updatedAt": "updatedAt",
      },
      ExpressionAttributeValues: {
        ":content": input.content,
        ":updatedAt": generateTimestamp(),
      },
      ConditionExpression: "attribute_exists(PK)",
      ReturnValues: "ALL_NEW",
    })
  );

  return (response.Attributes as CommentEntity) || null;
}

/**
 * Delete comment
 */
export async function deleteComment(
  postId: string,
  timestamp: string,
  commentId: string
): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: commentKeys.pk(postId),
        SK: commentKeys.sk(timestamp, commentId),
      },
    })
  );
}

/**
 * Delete comment by commentId (convenience method)
 */
export async function deleteCommentById(
  postId: string,
  commentId: string
): Promise<boolean> {
  // Query to find the comment
  const commentsResult = await getCommentsByPost(postId, { limit: 100 });
  const comment = commentsResult.items.find(
    (c) => c.commentId === commentId
  );

  if (!comment) {
    return false;
  }

  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: comment.PK,
        SK: comment.SK,
      },
    })
  );

  return true;
}
