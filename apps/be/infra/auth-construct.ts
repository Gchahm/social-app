import { Construct } from 'constructs';
import { UserPool, UserPoolClient } from 'aws-cdk-lib/aws-cognito';
import { CfnOutput } from 'aws-cdk-lib';

export class AuthConstruct extends Construct {
  public userPool: UserPool;
  private userPoolClient: UserPoolClient;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.userPool = this.createUserPool();
    this.userPoolClient = this.createUserPoolClient();

    new CfnOutput(this, 'SpaceUserPoolId', {
      value: this.userPool.userPoolId,
    });

    new CfnOutput(this, 'SpaceUserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
    });
  }

  private createUserPool() {
    return new UserPool(this, 'SpaceUserPool', {
      selfSignUpEnabled: true,
      signInAliases: {
        username: true,
        email: true,
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
}
