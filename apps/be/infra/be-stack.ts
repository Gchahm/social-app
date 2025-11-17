import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DatabaseConstruct } from './database-construct';
import { LambdaConstruct } from './lambda-construct';
import { ApiConstruct } from './api-construct';
import { AuthConstruct } from './auth-construct';
import { StorageConstruct } from './storage-construct';

export class BeStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const databaseConstruct = new DatabaseConstruct(this, 'DatabaseConstruct');

    const storageConstruct = new StorageConstruct(this, 'StorageConstruct');

    const lambdaConstruct = new LambdaConstruct(this, 'LambdaConstruct', {
      table: databaseConstruct.table,
      bucket: storageConstruct.bucket,
    });

    const authConstruct = new AuthConstruct(this, 'AuthConstruct');

    const apiConstruct = new ApiConstruct(this, 'ApiConstruct', {
      spacesIntegration: lambdaConstruct.photosIntegration,
      userPool: authConstruct.userPool,
    });

    new CfnOutput(this, 'ApiEndpoint', {
      value: apiConstruct.api.url,
    });
  }
}
