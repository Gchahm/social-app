import { Construct } from 'constructs';
import { UserPool, UserPoolClient } from 'aws-cdk-lib/aws-cognito';
import { RemovalPolicy } from 'aws-cdk-lib';
import { AuthLambdaConstruct } from './auth-lambda-construct';
import { BaseLambdaConstructProps } from './base-lambda-construct';
import { Environment } from './be-stack';

export interface AuthConstructProps extends BaseLambdaConstructProps {
  environment: Environment;
}

/**
 * Construct for managing authentication resources
 * Includes: Cognito User Pool, User Pool Client, and auth-related Lambdas
 */
export class AuthConstruct extends Construct {
  public userPool: UserPool;
  public userPoolClient: UserPoolClient;
  public authLambdaConstruct: AuthLambdaConstruct;

  constructor(scope: Construct, id: string, props: AuthConstructProps) {
    super(scope, id);

    // Create auth Lambda functions
    this.authLambdaConstruct = new AuthLambdaConstruct(
      this,
      'AuthLambdaConstruct',
      props
    );

    // Create user pool with post-confirmation trigger
    this.userPool = this.createUserPool(props.environment);
    this.userPoolClient = this.createUserPoolClient();
  }

  private createUserPool(environment: Environment) {
    const removalPolicy =
      environment === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY;

    return new UserPool(this, 'SpaceUserPool', {
      selfSignUpEnabled: true,
      signInAliases: {
        username: true,
        email: true,
      },
      lambdaTriggers: {
        postConfirmation: this.authLambdaConstruct.postRegistrationLambda,
      },
      removalPolicy,
    });
  }

  private createUserPoolClient() {
    return this.userPool.addClient('SpaceUserPoolClient', {
      authFlows: {
        adminUserPassword: true,
        custom: true,
        userPassword: true,
        userSrp: true,
      },
    });
  }
}
