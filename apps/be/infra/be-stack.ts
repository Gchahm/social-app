import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DatabaseConstruct } from './database-construct';
import { LambdaConstruct } from './lambda-construct';
import { ApiConstruct } from './api-construct';
import { AuthConstruct } from './auth-construct';

export class BeStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const databaseConstruct = new DatabaseConstruct(this, 'DatabaseConstruct');

    const lambdaConstruct = new LambdaConstruct(this, 'LambdaConstruct', {
      table: databaseConstruct.table,
    });

    const authConstruct = new AuthConstruct(this, 'AuthConstruct');

    new ApiConstruct(this, 'ApiConstruct', {
      spacesIntegration: lambdaConstruct.spacesIntegration,
      userPool: authConstruct.userPool,
    });
  }
}
