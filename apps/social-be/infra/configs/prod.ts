import { EnvironmentConfig } from './shared';
import { BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

export const prodConfig: EnvironmentConfig = {
  environment: 'prod',

  // DynamoDB - production-optimized
  tableBillingMode: BillingMode.PAY_PER_REQUEST, // Can switch to PROVISIONED if predictable traffic
  tableRemovalPolicy: RemovalPolicy.RETAIN, // Never auto-delete production data
  pointInTimeRecoverySpecification: {
    recoveryPeriodInDays: 1,
    pointInTimeRecoveryEnabled: true,
  }, // Critical for production

  // Lambda - production settings
  logRetentionDays: RetentionDays.ONE_MONTH,
  lambdaTimeout: Duration.seconds(3),
  lambdaMemorySize: 1024,
  minify: true,
  sourceMap: false,

  // S3 - retain production data
  bucketRemovalPolicy: RemovalPolicy.RETAIN,
  corsOrigins: [], // Update with your production domain

  // API Gateway - production limits
  throttleRateLimit: 10,
  throttleBurstLimit: 100,
};
