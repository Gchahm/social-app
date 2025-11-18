import { AttributeValue } from '@aws-sdk/client-dynamodb';

export interface User {
  userId: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Image {
  userId: string;
  imageId: string;
  // status: string; // e.g., "uploaded", "processed"
  originalS3Key: string;
  createdAt: string;
  title: string;
  description?: string;
  url?: string;
}

export interface DynamoDBItem extends Record<string, AttributeValue> {
  PK: { S: string };
  SK: { S: string };
  GSI1PK: { S: string };
  entityType: { S: 'USER' | 'IMAGE' };
  userId: { S: string };
  imageId: { S: string };
  originalS3Key: { S: string };
  createdAt: { S: string };
  title: { S: string };
  description?: { S: string };
}
