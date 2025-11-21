#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { UiStack } from './ui-stack';
import { CustomDomainConfig } from './frontend-domain-construct';
import { APP_NAME } from './constants';

const app = new App();

// Get environment from context (passed via CLI: --context environment=dev)
type Environment = 'dev' | 'staging' | 'prod';
const environment =
  (app.node.tryGetContext('environment') as Environment) || 'dev';

// Frontend can use its own domain or share with backend
// Use frontendDomainName if provided, otherwise fall back to domainName
const domainName = app.node.tryGetContext('domainName') as string;

const customDomain: CustomDomainConfig | undefined = domainName
  ? {
      domainName: `${environment}-${domainName}`,
      hostedZoneId: app.node.tryGetContext('hostedZoneId') as string,
      hostedZoneName: app.node.tryGetContext('hostedZoneName') as string,
      // Certificate must be in us-east-1 for CloudFront
      certificateArn: app.node.tryGetContext('certificateArn') as string,
    }
  : undefined;

// Validate environment
if (!['dev', 'staging', 'prod'].includes(environment)) {
  throw new Error(
    `Invalid environment: ${environment}. Must be dev, staging, or prod.`
  );
}

console.log(
  `🚀 Deploying frontend to ${environment.toUpperCase()} environment ${
    domainName ? `with custom domain ${domainName}` : ''
  }`
);

// Single AWS account configuration
const awsEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

new UiStack(app, `${APP_NAME}-${environment}-website`, {
  environment,
  env: awsEnv,
  customDomain,
  description: `Frontend stack for ${environment} environment`,
  tags: {
    Environment: environment,
    Project: APP_NAME,
    ManagedBy: 'CDK',
    Repository: 'aws-full-stack',
  },
});

app.synth();
