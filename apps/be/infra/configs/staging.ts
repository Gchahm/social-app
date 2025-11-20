import { customDomain, EnvironmentConfig } from './shared';
import { BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

export const stagingConfig: EnvironmentConfig = {
  // DynamoDB - production-like but cost-conscious
  tableBillingMode: BillingMode.PAY_PER_REQUEST,
  tableRemovalPolicy: RemovalPolicy.RETAIN, // Keep data for analysis
  pointInTimeRecoverySpecification: {
    pointInTimeRecoveryEnabled: false,
  }, // Enable backups

  // Lambda - production-like settings
  logRetentionDays: RetentionDays.TWO_WEEKS,
  lambdaTimeout: Duration.seconds(30),
  lambdaMemorySize: 1024,

  // S3 - retain for troubleshooting
  bucketRemovalPolicy: RemovalPolicy.RETAIN,
  corsOrigins: ['https://staging.yourdomain.com'], // Update with your staging domain

  // API Gateway - production-like limits
  throttleRateLimit: 5000,
  throttleBurstLimit: 10000,

  customDomain,
};
