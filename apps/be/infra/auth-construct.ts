import { Construct } from 'constructs';
import { UserPool, UserPoolClient } from 'aws-cdk-lib/aws-cognito';
import { CfnOutput } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';

export class AuthConstruct extends Construct {
  public userPool: UserPool;
  private userPoolClient: UserPoolClient;
  public postRegistrationLambda: NodejsFunction;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create Lambda function first
    this.postRegistrationLambda = this.createPostRegistrationLambda();

    // Create user pool with post-confirmation trigger
    this.userPool = this.createUserPool();
    this.userPoolClient = this.createUserPoolClient();

    new CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      exportName: 'UserPoolId',
    });

    new CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      exportName: 'UserPoolClientId',
    });
  }

  private createUserPool() {
    return new UserPool(this, 'SpaceUserPool', {
      selfSignUpEnabled: true,
      signInAliases: {
        username: true,
        email: true,
      },
      lambdaTriggers: {
        postConfirmation: this.postRegistrationLambda,
      },
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

  private createPostRegistrationLambda() {
    return new NodejsFunction(this, 'PostRegistrationLambda', {
      runtime: Runtime.NODEJS_22_X,
      handler: 'handler',
      entry: 'src/auth/post-registration.ts',
      environment: {
        // Add any environment variables your Lambda needs
        // TABLE_NAME: table.tableName,
      },
    });
  }
}
