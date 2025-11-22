import {
  docClient,
  TABLE_NAME,
  GSI1_NAME,
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
  BatchGetCommand,
} from './client';
import { likeKeys, generateTimestamp } from './keys';
import type {
  LikeEntity,
  CreateLikeInput,
  QueryResult,
  PaginationOptions,
} from './types';

/**
 * Create a new like (with duplicate prevention)
 */
export async function createLike(input: CreateLikeInput): Promise<LikeEntity> {
  const timestamp = generateTimestamp();

  const like: LikeEntity = {
    ...input,
    PK: likeKeys.pk(input.postId),
    SK: likeKeys.sk(input.userId),
    GSI1PK: likeKeys.gsi1pk(input.userId),
    GSI1SK: likeKeys.gsi1sk(timestamp, input.postId),
    entityType: 'LIKE',
    createdAt: timestamp,
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: like,
      ConditionExpression: 'attribute_not_exists(PK)',
    })
  );

  return like;
}

/**
 * Check if user liked a post
 */
export async function checkUserLikedPost(
  postId: string,
  userId: string
): Promise<boolean> {
  const response = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: likeKeys.pk(postId),
        SK: likeKeys.sk(userId),
      },
    })
  );

  return !!response.Item;
}

/**
 * Get like entity
 */
export async function getLike(
  postId: string,
  userId: string
): Promise<LikeEntity | null> {
  const response = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: likeKeys.pk(postId),
        SK: likeKeys.sk(userId),
      },
    })
  );

  return (response.Item as LikeEntity) || null;
}

/**
 * Get all likes for a post
 */
export async function getLikesByPost(
  postId: string,
  options: PaginationOptions = {}
): Promise<QueryResult<LikeEntity>> {
  const { limit = 50, lastEvaluatedKey } = options;

  const response = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
      ExpressionAttributeValues: {
        ':pk': likeKeys.pk(postId),
        ':prefix': 'LIKE#',
      },
      Limit: limit,
      ExclusiveStartKey: lastEvaluatedKey,
    })
  );

  return {
    items: (response.Items as LikeEntity[]) || [],
    lastEvaluatedKey: response.LastEvaluatedKey,
  };
}

/**
 * Get all posts a user has liked
 */
export async function getLikesByUser(
  userId: string,
  options: PaginationOptions = {}
): Promise<QueryResult<LikeEntity>> {
  const { limit = 50, lastEvaluatedKey } = options;

  const response = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: GSI1_NAME,
      KeyConditionExpression:
        'GSI1PK = :gsi1pk AND begins_with(GSI1SK, :prefix)',
      ExpressionAttributeValues: {
        ':gsi1pk': likeKeys.gsi1pk(userId),
        ':prefix': 'LIKE#',
      },
      ScanIndexForward: false, // newest first
      Limit: limit,
      ExclusiveStartKey: lastEvaluatedKey,
    })
  );

  return {
    items: (response.Items as LikeEntity[]) || [],
    lastEvaluatedKey: response.LastEvaluatedKey,
  };
}

/**
 * Remove a like
 */
export async function deleteLike(
  postId: string,
  userId: string
): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: likeKeys.pk(postId),
        SK: likeKeys.sk(userId),
      },
    })
  );
}

/**
 * Batch check which posts a user has liked from a given list
 * Returns a Set of postIds that the user has liked
 * More efficient than checking each post individually
 *
 * @throws Error if postIds.length > 100
 */
export async function getUserLikedPostsFromList(
  userId: string,
  postIds: string[]
): Promise<Set<string>> {
  if (postIds.length === 0) {
    return new Set();
  }

  // Enforce maximum batch size to prevent excessive queries
  if (postIds.length > 100) {
    throw new Error(
      `getUserLikedPostsFromList: Cannot check more than 100 posts at once. Received ${postIds.length} posts.`
    );
  }

  const likedPostIds = new Set<string>();

  const response = await docClient.send(
    new BatchGetCommand({
      RequestItems: {
        [TABLE_NAME]: {
          Keys: postIds.map((postId) => ({
            PK: likeKeys.pk(postId),
            SK: likeKeys.sk(userId),
          })),
        },
      },
    })
  );

  // Add found likes to the set
  const items = (response.Responses?.[TABLE_NAME] as LikeEntity[]) || [];
  items.forEach((item) => {
    // Extract postId from PK (format: "POST#postId")
    const postId = item.PK.replace('POST#', '');
    likedPostIds.add(postId);
  });

  return likedPostIds;
}
