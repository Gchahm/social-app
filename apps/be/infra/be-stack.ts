import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DatabaseConstruct } from './database-construct';
import { PhotosLambdaConstruct } from './photos-lambda-construct';
import { PostsLambdaConstruct } from './posts-lambda-construct';
import { ApiConstruct } from './api-construct';
import { AuthConstruct } from './auth-construct';
import { StorageConstruct } from './storage-construct';
import { BaseLambdaConstructProps } from './base-lambda-construct';
import { devConfig, EnvironmentConfig } from './configs';
import { stagingConfig } from './configs/staging';
import { prodConfig } from './configs/prod';
import { AuthLambdaConstruct } from './auth-lambda-construct';
import { HealthLambdaConstruct } from './health-lambda-construct';
import { DomainConstruct } from './domain-construct';

export type Environment = 'dev' | 'staging' | 'prod';

export interface BeStackProps extends StackProps {
  environment: Environment;
}

export class BeStack extends Stack {
  constructor(scope: Construct, id: string, props: BeStackProps) {
    // Add environment suffix to stack name for resource isolation
    const stackName = `${id}-${props.environment}`;
    super(scope, stackName, props);

    // Environment-specific configuration
    const envConfigs: Record<Environment, EnvironmentConfig> = {
      dev: devConfig,
      staging: stagingConfig,
      prod: prodConfig,
    };

    const config = envConfigs[props.environment];

    // Database construct with environment-specific config
    const databaseConstruct = new DatabaseConstruct(this, 'DatabaseConstruct', {
      billingMode: config.tableBillingMode,
      removalPolicy: config.tableRemovalPolicy,
      pointInTimeRecoverySpecification: config.pointInTimeRecoverySpecification,
    });

    // Storage construct with environment-specific config
    const storageConstruct = new StorageConstruct(this, 'StorageConstruct', {
      removalPolicy: config.bucketRemovalPolicy,
      corsOrigins: config.corsOrigins,
    });

    // Lambda shared configuration
    const lambdaProps: BaseLambdaConstructProps = {
      table: databaseConstruct.table,
      bucket: storageConstruct.bucket,
      environment: {
        TABLE_NAME: databaseConstruct.table.tableName,
        BUCKET_NAME: storageConstruct.bucket.bucketName,
        SERVICE_NAME: stackName,
        ENVIRONMENT: props.environment,
        CORS_ORIGINS: config.corsOrigins.join(','),
      },
      envName: props.environment,
      logRetention: config.logRetentionDays,
      timeout: config.lambdaTimeout,
      memorySize: config.lambdaMemorySize,
    };

    const photosLambdaConstruct = new PhotosLambdaConstruct(
      this,
      'PhotosLambdaConstruct',
      lambdaProps
    );

    const postsLambdaConstruct = new PostsLambdaConstruct(
      this,
      'PostsLambdaConstruct',
      lambdaProps
    );

    const authLambdaConstruct = new AuthLambdaConstruct(
      this,
      'AuthLambdaConstruct',
      lambdaProps
    );

    const healthLambdaConstruct = new HealthLambdaConstruct(
      this,
      'HealthLambdaConstruct',
      lambdaProps
    );

    const authConstruct = new AuthConstruct(this, 'AuthConstruct', {
      environment: props.environment,
      postRegistrationLambda: authLambdaConstruct.postRegistrationLambda,
    });

    const apiConstruct = new ApiConstruct(this, 'ApiConstruct', {
      userPool: authConstruct.userPool,
      postsLambdas: postsLambdaConstruct.lambdas,
      photosLambdas: photosLambdaConstruct.lambdas,
      healthLambdas: healthLambdaConstruct.lambdas,
      corsOrigins: config.corsOrigins,
      throttleRateLimit: config.throttleRateLimit,
      throttleBurstLimit: config.throttleBurstLimit,
    });

    // Custom domain setup (optional, based on configuration)
    const domainConstruct = new DomainConstruct(this, 'DomainConstruct', {
      customDomain: config.customDomain,
      api: apiConstruct.api,
    });

    // Stack outputs with environment-specific export names
    new CfnOutput(this, 'Environment', {
      value: props.environment,
      description: 'Deployment environment',
      exportName: `${stackName}-Environment`,
    });

    new CfnOutput(this, 'ApiEndpoint', {
      value: apiConstruct.api.url,
      description: 'API Gateway endpoint URL',
      exportName: `${stackName}-ApiEndpoint`,
    });

    // Output custom domain URL if configured
    if (domainConstruct.domainName && config.customDomain?.domainName) {
      new CfnOutput(this, 'CustomDomainUrl', {
        value: `https://${config.customDomain.domainName}`,
        description: 'Custom domain URL for API',
        exportName: `${stackName}-CustomDomainUrl`,
      });
    }

    new CfnOutput(this, 'UserPoolId', {
      value: authConstruct.userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: `${stackName}-UserPoolId`,
    });

    new CfnOutput(this, 'UserPoolClientId', {
      value: authConstruct.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      exportName: `${stackName}-UserPoolClientId`,
    });

    new CfnOutput(this, 'TableName', {
      value: databaseConstruct.table.tableName,
      description: 'DynamoDB table name',
      exportName: `${stackName}-TableName`,
    });

    new CfnOutput(this, 'BucketName', {
      value: storageConstruct.bucket.bucketName,
      description: 'S3 bucket name',
      exportName: `${stackName}-BucketName`,
    });

    // Add tags to all resources for cost tracking and organization
    this.tags.setTag('Environment', props.environment);
    this.tags.setTag('Project', 'FullStackApp');
    this.tags.setTag('ManagedBy', 'CDK');
    this.tags.setTag(
      'CostCenter',
      props.environment === 'prod' ? 'Production' : 'Development'
    );
  }
}
