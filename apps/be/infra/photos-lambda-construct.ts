import { Construct } from 'constructs';
import { ITable } from 'aws-cdk-lib/aws-dynamodb';
import { Integration } from 'aws-cdk-lib/aws-apigateway';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { BaseLambdaConstruct } from './base-lambda-construct';

export interface PhotosLambdaConstructProps {
  table: ITable;
  bucket: IBucket;
}

export interface PhotosIntegrations {
  requestPhotoUploadUrl: Integration;
  confirmPhotoUpload: Integration;
}

/**
 * Construct for managing all Photos-related Lambda functions
 * Uses presigned URL flow for direct S3 uploads
 */
export class PhotosLambdaConstruct extends BaseLambdaConstruct {
  // Presigned URL flow
  public readonly integrations: PhotosIntegrations;
  public readonly confirmUploadIntegration: Integration;

  constructor(scope: Construct, id: string, props: PhotosLambdaConstructProps) {
    super(scope, id, props.table, props.bucket);

    this.integrations = {
      requestPhotoUploadUrl: this.createLambdaIntegration(
        'RequestUploadUrl',
        'src/photos/request-upload-url.ts',
        {
          functionName: 'photos-RequestUploadUrl',
          description: 'Photos API: Request presigned URL for upload',
          grantS3Write: true, // Needs permission to generate presigned URLs
        }
      ),
      confirmPhotoUpload: this.createLambdaIntegration(
        'ConfirmUpload',
        'src/photos/confirm-upload.ts',
        {
          functionName: 'photos-ConfirmUpload',
          description: 'Photos API: Confirm upload and save metadata',
          // Only needs DynamoDB write (no S3 permissions)
        }
      ),
    };
  }
}
