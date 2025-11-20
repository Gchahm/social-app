import { Construct } from 'constructs';
import { UserPool, UserPoolClient } from 'aws-cdk-lib/aws-cognito';
import { RemovalPolicy } from 'aws-cdk-lib';
import { Environment } from './be-stack';
import { IFunction } from 'aws-cdk-lib/aws-lambda';

export interface AuthConstructProps {
  environment: Environment;
  postRegistrationLambda: IFunction;
}

/**
 * Construct for managing authentication resources
 * Includes: Cognito User Pool, User Pool Client, and auth-related Lambdas
 */
export class AuthConstruct extends Construct {
  public userPool: UserPool;
  public userPoolClient: UserPoolClient;

  constructor(scope: Construct, id: string, props: AuthConstructProps) {
    super(scope, id);

    // Create user pool with post-confirmation trigger
    this.userPool = this.createUserPool(
      props.environment,
      props.postRegistrationLambda
    );
    this.userPoolClient = this.createUserPoolClient();
  }

  private createUserPool(
    environment: Environment,
    postConfirmation: IFunction
  ) {
    const removalPolicy =
      environment === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY;

    return new UserPool(this, 'SpaceUserPool', {
      selfSignUpEnabled: true,
      signInAliases: {
        username: true,
        email: true,
      },
      lambdaTriggers: {
        postConfirmation,
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
