import { Construct } from 'constructs';
import { UserPool, UserPoolClient } from 'aws-cdk-lib/aws-cognito';
import { CfnOutput, RemovalPolicy } from 'aws-cdk-lib';
import { Environment } from './be-stack';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { APP_NAME } from './constants';

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
    this.userPoolClient = this.createUserPoolClient(props.environment);

    new CfnOutput(scope, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: `UserPoolId`,
    });

    new CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      exportName: `UserPoolClientId`,
    });
  }

  private createUserPool(
    environment: Environment,
    postConfirmation: IFunction
  ) {
    const removalPolicy =
      environment === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY;

    return new UserPool(this, `${APP_NAME}-user-pool-${environment}`, {
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

  private createUserPoolClient(environment: Environment) {
    return this.userPool.addClient(
      `${APP_NAME}-user-pool-client-${environment}`,
      {
        authFlows: {
          adminUserPassword: true,
          custom: true,
          userPassword: true,
          userSrp: true,
        },
      }
    );
  }
}
