import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import {
  BaseLambdaConstruct,
  BaseLambdaConstructProps,
} from './base-lambda-construct';

export interface PhotosLambdas {
  requestPhotoUploadUrl: NodejsFunction;
}

/**
 * Construct for managing all Photos-related Lambda functions
 * Uses presigned URL flow for direct S3 uploads
 */
export class PhotosLambdaConstruct extends BaseLambdaConstruct {
  // Presigned URL flow
  public readonly lambdas: PhotosLambdas;

  constructor(scope: Construct, id: string, props: BaseLambdaConstructProps) {
    super(scope, id, props);

    this.lambdas = {
      requestPhotoUploadUrl: this.createLambdaFunction(
        'RequestUploadUrl',
        'src/lambda/photos/request-upload-url.ts',
        {
          functionName: 'photos-RequestUploadUrl',
          description: 'Photos API: Request presigned URL for upload',
          grantS3Write: true, // Needs permission to generate presigned URLs
        }
      ),
    };
  }
}
