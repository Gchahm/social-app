#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { UiStack } from './ui-stack';
import { APP_NAME } from './constants';
import { getDomain, getEnvironment } from './utils';

const app = new App();

const environment = getEnvironment(app);
const customDomain = getDomain(app, environment);

// Validate environment
if (!['dev', 'staging', 'prod'].includes(environment)) {
  throw new Error(
    `Invalid environment: ${environment}. Must be dev, staging, or prod.`
  );
}

console.log(
  `🚀 Deploying frontend to ${environment.toUpperCase()} environment`
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
