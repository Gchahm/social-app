import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  BatchWriteCommand,
  BatchGetCommand,
} from '@aws-sdk/lib-dynamodb';

/**
 * Table and index names
 */
export const TABLE_NAME = process.env.TABLE_NAME || 'SocialMediaApp';
export const GSI1_NAME = 'GSI1';
export const GSI2_NAME = 'GSI2';
export const GSI3_NAME = 'GSI3';

/**
 * DynamoDB client configuration
 */
export const dynamoDBClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

/**
 * Document client for simplified operations
 */
export const docClient = DynamoDBDocumentClient.from(dynamoDBClient, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

/**
 * Export command classes for use in data access layer
 */
export {
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  BatchWriteCommand,
  BatchGetCommand,
};
