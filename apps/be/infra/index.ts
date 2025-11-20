#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { BeStack, Environment } from './be-stack';

const app = new cdk.App();

// Get environment from context (passed via CLI: --context environment=dev)
const environment = (app.node.tryGetContext('environment') as Environment) || 'dev';

// Validate environment
if (!['dev', 'staging', 'prod'].includes(environment)) {
  throw new Error(
    `Invalid environment: ${environment}. Must be dev, staging, or prod.`
  );
}

console.log(`🚀 Deploying to ${environment.toUpperCase()} environment`);

// Single AWS account configuration
// All environments deploy to the same account with isolated resources
const awsEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

new BeStack(app, 'BeStack', {
  environment,
  env: awsEnv,
  description: `Backend stack for ${environment} environment - Full Stack App`,
  tags: {
    Environment: environment,
    Project: 'FullStackApp',
    ManagedBy: 'CDK',
    Repository: 'aws-full-stack',
  },
});

app.synth();
