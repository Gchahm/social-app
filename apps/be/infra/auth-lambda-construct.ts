import { Construct } from 'constructs';
import {
  BaseLambdaConstruct,
  BaseLambdaConstructProps,
} from './base-lambda-construct';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export interface AuthIntegrations {
  postRegistration: NodejsFunction;
}

/**
 * Construct for managing all Auth-related Lambda functions
 * Includes: Post-confirmation trigger for user registration
 */
export class AuthLambdaConstruct extends BaseLambdaConstruct {
  public readonly postRegistrationLambda: NodejsFunction;

  constructor(scope: Construct, id: string, props: BaseLambdaConstructProps) {
    super(scope, id, props);

    // Create post-registration Lambda (used as Cognito trigger)
    this.postRegistrationLambda = this.createPostRegistrationLambda();
  }

  private createPostRegistrationLambda(): NodejsFunction {
    // Note: We don't use createLambdaIntegration here because this Lambda
    // is used as a Cognito trigger, not an API Gateway integration
    const baseFunctionName = 'auth-PostRegistration';
    const functionName = `${baseFunctionName}-${this.envName}`;

    const lambda = new NodejsFunction(this, 'PostRegistrationLambda', {
      runtime: this.commonConfig.runtime,
      handler: 'handler',
      entry: 'src/lambda/auth/post-registration.ts',
      functionName,
      description: `Auth: Post-registration trigger (${this.envName})`,
      timeout: this.commonConfig.timeout,
      memorySize: this.commonConfig.memorySize,
      environment: this.commonConfig.environment,
      logRetention: this.commonConfig.logRetention,
      bundling: {
        minify: this.commonConfig.minify,
        sourceMap: this.commonConfig.sourceMap,
        externalModules: ['@aws-sdk/*'],
      },
    });

    // Grant DynamoDB write permissions for creating user records
    this.table.grantWriteData(lambda);

    return lambda;
  }
}