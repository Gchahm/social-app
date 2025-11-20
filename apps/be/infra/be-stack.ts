import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DatabaseConstruct } from './database-construct';
import { PhotosLambdaConstruct } from './photos-lambda-construct';
import { PostsLambdaConstruct } from './posts-lambda-construct';
import { ApiConstruct } from './api-construct';
import { AuthConstruct } from './auth-construct';
import { StorageConstruct } from './storage-construct';
import { BaseLambdaConstructProps } from './base-lambda-construct';

export class BeStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const databaseConstruct = new DatabaseConstruct(this, 'DatabaseConstruct');

    const storageConstruct = new StorageConstruct(this, 'StorageConstruct');

    const lambdaProps: BaseLambdaConstructProps = {
      table: databaseConstruct.table,
      bucket: storageConstruct.bucket,
      environment: {
        TABLE_NAME: databaseConstruct.table.tableName,
        BUCKET_NAME: storageConstruct.bucket.bucketName,
        SERVICE_NAME: id,
      },
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

    const authConstruct = new AuthConstruct(this, 'AuthConstruct', {
      table: databaseConstruct.table,
    });

    const apiConstruct = new ApiConstruct(this, 'ApiConstruct', {
      userPool: authConstruct.userPool,
      postsIntegrations: postsLambdaConstruct.postsIntegrations,
      photosIntegrations: photosLambdaConstruct.integrations,
    });

    new CfnOutput(this, 'ApiEndpoint', {
      value: apiConstruct.api.url,
    });

    new CfnOutput(this, 'TableName', {
      value: databaseConstruct.table.tableName,
    });

    new CfnOutput(this, 'BucketName', {
      value: storageConstruct.bucket.bucketName,
    });
  }
}
