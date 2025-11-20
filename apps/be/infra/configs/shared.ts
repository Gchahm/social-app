import {
  BillingMode,
  PointInTimeRecoverySpecification,
} from 'aws-cdk-lib/aws-dynamodb';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

export interface EnvironmentConfig {
  tableBillingMode: BillingMode;
  tableRemovalPolicy: RemovalPolicy;
  pointInTimeRecoverySpecification: PointInTimeRecoverySpecification;

  logRetentionDays: RetentionDays;
  lambdaTimeout: Duration;
  lambdaMemorySize: number;

  bucketRemovalPolicy: RemovalPolicy;
  corsOrigins: string[];


  // API Gateway settings
  throttleRateLimit: number;
  throttleBurstLimit: number;
}
