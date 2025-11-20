import { Construct } from 'constructs';
import {
  BaseLambdaConstruct,
  BaseLambdaConstructProps,
} from './base-lambda-construct';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export interface AuthLambdas {
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

    // Create post-registration Lambda (used as Cognito trigger, not API Gateway)
    this.postRegistrationLambda = this.createLambdaFunction(
      'PostRegistrationLambda',
      'src/lambda/auth/post-registration.ts',
      {
        functionName: 'auth-PostRegistration',
        description: 'Auth: Post-registration trigger',
      }
    );
  }
}