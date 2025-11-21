import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { ITable } from 'aws-cdk-lib/aws-dynamodb';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { Duration } from 'aws-cdk-lib';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { ILambdaEnvironmentVariables } from './types';
import { APP_NAME } from './constants';
import { EnvironmentConfig } from './configs';

export interface BaseLambdaConfig {
  runtime?: Runtime;
  timeout?: Duration;
  memorySize?: number;
  environment?: Record<string, string>;
  minify?: boolean;
  sourceMap?: boolean;
  logRetention?: RetentionDays;
}

export interface BaseLambdaConstructProps extends EnvironmentConfig {
  table: ITable;
  bucket: IBucket;
  envName?: string; // Environment name for resource naming (dev/staging/prod)
}

/**
 * Base construct for creating Lambda functions with common configuration
 * Provides reusable patterns for creating Lambdas with API Gateway integrations
 */
export abstract class BaseLambdaConstruct extends Construct {
  protected readonly table: ITable;
  protected readonly bucket: IBucket;
  protected readonly commonConfig: BaseLambdaConfig;
  protected readonly envName: string;

  constructor(scope: Construct, id: string, props: BaseLambdaConstructProps) {
    super(scope, id);

    const {
      table,
      bucket,
      envName,
      lambdaTimeout,
      lambdaMemorySize,
      logRetentionDays,
      minify,
      sourceMap,
    } = props;

    this.table = table;
    this.bucket = bucket;
    this.envName = envName || 'dev';

    // Default common configuration with environment-specific overrides
    this.commonConfig = {
      runtime: Runtime.NODEJS_22_X,
      timeout: lambdaTimeout || Duration.seconds(3),
      memorySize: lambdaMemorySize || 256,
      minify,
      sourceMap,
      environment: {
        TABLE_NAME: props.table.tableName,
        BUCKET_NAME: props.bucket.bucketName,
        SERVICE_NAME: APP_NAME,
        ENVIRONMENT: props.envName,
        CORS_ORIGINS: props.corsOrigins.join(','),
      },
      logRetention: logRetentionDays || RetentionDays.ONE_WEEK,
    };
  }

  /**
   * Create a Lambda function
   */
  protected createLambdaFunction(
    id: string,
    entry: string,
    options?: {
      description?: string;
      functionName?: string;
      environment?: Record<string, string>;
      grantS3Read?: boolean;
      grantS3Write?: boolean;
      timeout?: Duration;
      memorySize?: number;
    }
  ): NodejsFunction {
    // Merge environment variables
    const environment = {
      ...this.commonConfig.environment,
      ...options?.environment,
    };

    // Create environment-specific function name
    const baseFunctionName = options?.functionName || id;
    const functionName = `${APP_NAME}-${baseFunctionName}-${this.envName}`;

    // Create Lambda function
    const lambdaFn = new NodejsFunction(this, id, {
      runtime: this.commonConfig.runtime,
      handler: 'handler',
      entry,
      functionName,
      description:
        options?.description || `Lambda function: ${id} (${this.envName})`,
      timeout: options?.timeout || this.commonConfig.timeout,
      memorySize: options?.memorySize || this.commonConfig.memorySize,
      environment,
      logRetention: this.commonConfig.logRetention,
      bundling: {
        minify: this.commonConfig.minify,
        sourceMap: this.commonConfig.sourceMap,
        externalModules: ['@aws-sdk/*'], // AWS SDK v3 is included in Lambda runtime
      },
    });

    // Grant DynamoDB permissions (all Lambdas need this)
    this.table.grantReadWriteData(lambdaFn);

    // Grant S3 permissions if requested
    if (this.bucket) {
      if (options?.grantS3Read && options?.grantS3Write) {
        this.bucket.grantReadWrite(lambdaFn);
      } else if (options?.grantS3Read) {
        this.bucket.grantRead(lambdaFn);
      } else if (options?.grantS3Write) {
        this.bucket.grantWrite(lambdaFn);
        this.bucket.grantPutAcl(lambdaFn); // For presigned URLs
      }
    }

    return lambdaFn;
  }

  /**
   * Create multiple Lambda functions at once
   */
  protected createLambdaFunctions(
    configs: Array<{
      id: string;
      entry: string;
      description?: string;
      functionName?: string;
      environment?: Record<string, string>;
      grantS3Read?: boolean;
      grantS3Write?: boolean;
      timeout?: Duration;
      memorySize?: number;
    }>
  ): Record<string, NodejsFunction> {
    const functions: Record<string, NodejsFunction> = {};

    configs.forEach((config) => {
      functions[config.id] = this.createLambdaFunction(
        config.id,
        config.entry,
        config
      );
    });

    return functions;
  }

  /**
   * Get common environment variables
   */
  protected getCommonEnvironment(): Record<string, string> {
    return { ...this.commonConfig.environment };
  }

  /**
   * Override to customize Lambda configuration
   */
  protected customizeConfig(config: Partial<BaseLambdaConfig>): void {
    Object.assign(this.commonConfig, config);
  }
}
