import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { ITable } from 'aws-cdk-lib/aws-dynamodb';
import { Integration, LambdaIntegration } from 'aws-cdk-lib/aws-apigateway';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { Duration } from 'aws-cdk-lib';
import { ILambdaEnvironmentVariables } from './types';

export interface BaseLambdaConfig {
  runtime?: Runtime;
  timeout?: Duration;
  memorySize?: number;
  environment?: Record<string, string>;
  minify?: boolean;
  sourceMap?: boolean;
}

export interface BaseLambdaConstructProps {
  table: ITable;
  bucket: IBucket;
  environment: ILambdaEnvironmentVariables;
}

/**
 * Base construct for creating Lambda functions with common configuration
 * Provides reusable patterns for creating Lambdas with API Gateway integrations
 */
export abstract class BaseLambdaConstruct extends Construct {
  protected readonly table: ITable;
  protected readonly bucket: IBucket;
  protected readonly commonConfig: BaseLambdaConfig;

  constructor(scope: Construct, id: string, props: BaseLambdaConstructProps) {
    super(scope, id);

    const { table, bucket, environment } = props;

    this.table = table;
    this.bucket = bucket;

    // Default common configuration
    this.commonConfig = {
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(30),
      memorySize: 256,
      minify: true,
      sourceMap: true,
      environment,
    };
  }

  /**
   * Create a Lambda function with API Gateway integration
   */
  protected createLambdaIntegration(
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
  ): Integration {
    // Merge environment variables
    const environment = {
      ...this.commonConfig.environment,
      ...options?.environment,
    };

    // Create Lambda function
    const lambdaFn = new NodejsFunction(this, id, {
      runtime: this.commonConfig.runtime,
      handler: 'handler',
      entry,
      functionName: options?.functionName || id,
      description: options?.description || `Lambda function: ${id}`,
      timeout: options?.timeout || this.commonConfig.timeout,
      memorySize: options?.memorySize || this.commonConfig.memorySize,
      environment,
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

    // Create and return API Gateway integration
    return new LambdaIntegration(lambdaFn, {
      proxy: true,
      allowTestInvoke: true,
    });
  }

  /**
   * Create multiple Lambda integrations at once
   */
  protected createLambdaIntegrations(
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
  ): Record<string, Integration> {
    const integrations: Record<string, Integration> = {};

    configs.forEach((config) => {
      integrations[config.id] = this.createLambdaIntegration(
        config.id,
        config.entry,
        config
      );
    });

    return integrations;
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
