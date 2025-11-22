#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { BeStack } from './be-stack';
import { APP_NAME } from './constants';
import { getDomain, getEnvironment } from './utils';

const app = new cdk.App();

const environment = getEnvironment(app);
const customDomain = getDomain(app, environment);

// Validate environment
if (!['dev', 'staging', 'prod'].includes(environment)) {
  throw new Error(
    `Invalid environment: ${environment}. Must be dev, staging, or prod.`
  );
}

console.log(`🚀 Deploying to ${environment.toUpperCase()} environment `);

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
