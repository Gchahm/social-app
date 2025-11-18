import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { APIGatewayProxyEventSchema } from '@aws-lambda-powertools/parser/lib/esm/schemas/api-gateway';
import { z } from 'zod/index';

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
}

export type ProxyEvent = z.infer<typeof APIGatewayProxyEventSchema>;
