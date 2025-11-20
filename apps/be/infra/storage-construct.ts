import { Construct } from 'constructs';
import { Bucket, HttpMethods, BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import { RemovalPolicy } from 'aws-cdk-lib';

export interface StorageConstructProps {
  removalPolicy: RemovalPolicy;
  corsOrigins: string[];
}

export class StorageConstruct extends Construct {
  public bucket: Bucket;

  constructor(scope: Construct, id: string, props: StorageConstructProps) {
    super(scope, id);

    this.bucket = new Bucket(this, 'PhotosBucket', {
      // Allow public read access to uploaded images
      publicReadAccess: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ACLS_ONLY,
      removalPolicy: props.removalPolicy,
      autoDeleteObjects: props.removalPolicy === RemovalPolicy.DESTROY,
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
      versioned: props.removalPolicy === RemovalPolicy.RETAIN, // Enable versioning for prod
    });
  }
}
