import {
  BillingMode,
  PointInTimeRecoverySpecification,
} from 'aws-cdk-lib/aws-dynamodb';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

export interface CustomDomainConfig {
  domainName?: string;
  hostedZoneId?: string;
  hostedZoneName?: string;
  certificateArn?: string;
}

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

  // Custom domain settings (optional)
  customDomain?: CustomDomainConfig;
}

export const customDomain: CustomDomainConfig | undefined = process.env
  .API_DOMAIN_NAME
  ? {
      domainName: `api-${process.env.API_DOMAIN_NAME}`,
      hostedZoneId: process.env.HOSTED_ZONE_ID,
      hostedZoneName: process.env.HOSTED_ZONE_NAME,
      certificateArn: process.env.CERTIFICATE_ARN,
    }
  : undefined;
