#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { BeStack, Environment } from './be-stack';
import { APP_NAME } from './constants';
import { CustomDomainConfig } from './domain-construct';

const app = new cdk.App();

// Get environment from context (passed via CLI: --context environment=dev)
const environment =
  (app.node.tryGetContext('environment') as Environment) || 'dev';

const domainName = app.node.tryGetContext('domainName') as string;

const customDomain: CustomDomainConfig | undefined = domainName
  ? {
      domainName: `${environment}api-${domainName}`,
      hostedZoneId: app.node.tryGetContext('hostedZoneId') as string,
      hostedZoneName: app.node.tryGetContext('hostedZoneName') as string,
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
  `🚀 Deploying to ${environment.toUpperCase()} environment ${
    domainName ? `with custom domain ${domainName}` : ''
  }`
);

// Single AWS account configuration
// All environments deploy to the same account with isolated resources
const awsEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

new BeStack(app, APP_NAME, {
  environment,
  env: awsEnv,
  customDomain,
  description: `Backend stack for ${environment} environment - Full Stack App`,
  tags: {
    Environment: environment,
    Project: APP_NAME,
    ManagedBy: 'CDK',
    Repository: 'aws-full-stack',
  },
});

app.synth();
