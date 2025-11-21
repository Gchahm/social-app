import { Construct } from 'constructs';
import { Bucket, HttpMethods, BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import { CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import { EnvironmentConfig } from './configs';

export type StorageConstructProps = EnvironmentConfig;

export class StorageConstruct extends Construct {
  public bucket: Bucket;

  constructor(scope: Construct, id: string, props: StorageConstructProps) {
    super(scope, id);

    this.bucket = new Bucket(this, 'PhotosBucket', {
      // Allow public read access to uploaded images
      publicReadAccess: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ACLS_ONLY,
      removalPolicy: props.bucketRemovalPolicy,
      autoDeleteObjects: props.bucketRemovalPolicy === RemovalPolicy.DESTROY,
      cors: [
        {
          allowedOrigins: props.corsOrigins,
          allowedMethods: [
            HttpMethods.GET,
            HttpMethods.PUT,
            HttpMethods.POST,
            HttpMethods.DELETE,
            HttpMethods.HEAD,
          ],
          allowedHeaders: ['*'],
          exposedHeaders: ['ETag'],
        },
      ],
      versioned: props.bucketRemovalPolicy === RemovalPolicy.RETAIN, // Enable versioning for prod
    });

    new CfnOutput(this, 'BucketName', {
      value: this.bucket.bucketName,
      description: 'S3 bucket name',
      exportName: `BucketName`,
    });
  }
}
