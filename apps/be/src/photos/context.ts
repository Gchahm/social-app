import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { S3 } from '@aws-sdk/client-s3';

export interface PhotosContext {
  db: DynamoDB;
  s3: S3;
  tableName: string;
  bucketName: string;
}

// Singleton instances (created once per Lambda cold start)
let _db: DynamoDB | null = null;
let _s3: S3 | null = null;

/**
 * Gets or creates the AWS service clients for the Photos Lambda
 * Clients are reused across warm invocations for better performance
 */
export function getContext(): PhotosContext {
  if (!_db) {
    _db = new DynamoDB();
  }

  if (!_s3) {
    _s3 = new S3();
  }

  return {
    db: _db,
    s3: _s3,
    tableName: process.env.TABLE_NAME!,
    bucketName: process.env.BUCKET_NAME!,
  };
}

/**
 * For testing: allows injection of mock clients
 */
export function setContext(context: Partial<PhotosContext>): void {
  if (context.db) _db = context.db;
  if (context.s3) _s3 = context.s3;
}

/**
 * For testing: resets the singleton instances
 */
export function resetContext(): void {
  _db = null;
  _s3 = null;
}
