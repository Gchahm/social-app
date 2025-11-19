import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { ITable } from 'aws-cdk-lib/aws-dynamodb';
import { Integration, LambdaIntegration } from 'aws-cdk-lib/aws-apigateway';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { Duration } from 'aws-cdk-lib';

export interface PhotosLambdaConstructProps {
  table: ITable;
  bucket: IBucket;
}

/**
 * Construct for managing all Photos-related Lambda functions
 * Supports both presigned URL uploads (recommended) and legacy direct uploads
 */
export class PhotosLambdaConstruct extends Construct {
  // Presigned URL flow (recommended)
  public readonly requestUploadUrlIntegration: Integration;
  public readonly confirmUploadIntegration: Integration;

  // Legacy handlers (for backward compatibility)
  public readonly getPhotosIntegration: Integration;
  public readonly uploadPhotoIntegration: Integration;

  constructor(scope: Construct, id: string, props: PhotosLambdaConstructProps) {
    super(scope, id);

    const { table, bucket } = props;

    // Common environment variables
    const commonEnv = {
      TABLE_NAME: table.tableName,
      BUCKET_NAME: bucket.bucketName,
      AWS_REGION: process.env.CDK_DEFAULT_REGION || 'us-east-1',
    };

    // Common Lambda configuration
    const commonConfig = {
      runtime: Runtime.NODEJS_22_X,
      handler: 'handler',
      timeout: Duration.seconds(30),
      memorySize: 256,
      environment: commonEnv,
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['@aws-sdk/*'],
      },
    };

    // Request Upload URL (Presigned URL)
    this.requestUploadUrlIntegration = this.createPhotoLambda(
      'RequestUploadUrl',
      'src/photos/request-upload-url.ts',
      table,
      bucket,
      commonConfig,
      { needsS3Read: false, needsS3Write: true } // Only needs permission to generate presigned URLs
    );

    // Confirm Upload (Save metadata after upload)
    this.confirmUploadIntegration = this.createPhotoLambda(
      'ConfirmUpload',
      'src/photos/confirm-upload.ts',
      table,
      bucket,
      commonConfig,
      { needsS3Read: false, needsS3Write: false } // Only needs DynamoDB write
    );

    // Get Photos (List/retrieve photos)
    this.getPhotosIntegration = this.createPhotoLambda(
      'GetPhotos',
      'src/photos/get.ts',
      table,
      bucket,
      commonConfig,
      { needsS3Read: true, needsS3Write: false }
    );

    // Upload Photo (Legacy direct upload)
    this.uploadPhotoIntegration = this.createPhotoLambda(
      'UploadPhoto',
      'src/photos/post.ts',
      table,
      bucket,
      commonConfig,
      { needsS3Read: false, needsS3Write: true }
    );
  }

  /**
   * Helper method to create a Lambda function and integration
   */
  private createPhotoLambda(
    id: string,
    entry: string,
    table: ITable,
    bucket: IBucket,
    config: any,
    permissions: { needsS3Read: boolean; needsS3Write: boolean }
  ): Integration {
    const lambdaFn = new NodejsFunction(this, id, {
      ...config,
      entry,
      functionName: `photos-${id}`,
      description: `Photos API: ${id}`,
    });

    // Grant DynamoDB permissions
    table.grantReadWriteData(lambdaFn);

    // Grant S3 permissions based on needs
    if (permissions.needsS3Read && permissions.needsS3Write) {
      bucket.grantReadWrite(lambdaFn);
    } else if (permissions.needsS3Read) {
      bucket.grantRead(lambdaFn);
    } else if (permissions.needsS3Write) {
      bucket.grantWrite(lambdaFn);
      bucket.grantPutAcl(lambdaFn); // For presigned URLs
    }

    // Create and return API Gateway integration
    return new LambdaIntegration(lambdaFn, {
      proxy: true,
      allowTestInvoke: true,
    });
  }
}
