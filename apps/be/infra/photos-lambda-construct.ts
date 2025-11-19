import { Construct } from 'constructs';
import { Integration } from 'aws-cdk-lib/aws-apigateway';
import {
  BaseLambdaConstruct,
  BaseLambdaConstructProps,
} from './base-lambda-construct';

export interface PhotosIntegrations {
  requestPhotoUploadUrl: Integration;
}

/**
 * Construct for managing all Photos-related Lambda functions
 * Uses presigned URL flow for direct S3 uploads
 */
export class PhotosLambdaConstruct extends BaseLambdaConstruct {
  // Presigned URL flow
  public readonly integrations: PhotosIntegrations;

  constructor(scope: Construct, id: string, props: BaseLambdaConstructProps) {
    super(scope, id, props);

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
    };
  }
}
