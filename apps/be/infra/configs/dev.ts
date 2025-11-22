import { BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { EnvironmentConfig } from './shared';

export const devConfig: EnvironmentConfig = {
  environment: 'dev',

  // DynamoDB - cost-optimized for development
  tableBillingMode: BillingMode.PAY_PER_REQUEST,
  tableRemovalPolicy: RemovalPolicy.DESTROY, // Auto-cleanup for dev
  pointInTimeRecoverySpecification: {
    pointInTimeRecoveryEnabled: false,
  },

  // Lambda - basic settings for development
  logRetentionDays: RetentionDays.ONE_WEEK,
  lambdaTimeout: Duration.seconds(3),
  lambdaMemorySize: 512,
  minify: false,
  sourceMap: false,

  // S3 - auto-cleanup for dev
  bucketRemovalPolicy: RemovalPolicy.DESTROY,
  corsOrigins: ['http://localhost:4200', 'http://localhost:3000'],

  // API Gateway - relaxed limits for dev
  throttleRateLimit: 10,
  throttleBurstLimit: 100,
};
