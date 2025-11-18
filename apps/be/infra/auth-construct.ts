import { Construct } from 'constructs';
import { UserPool, UserPoolClient } from 'aws-cdk-lib/aws-cognito';
import { CfnOutput } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { ITable } from 'aws-cdk-lib/aws-dynamodb';

export interface AuthConstructProps {
  table: ITable;
}

export class AuthConstruct extends Construct {
  public userPool: UserPool;
  private userPoolClient: UserPoolClient;
  public postRegistrationLambda: NodejsFunction;

  constructor(scope: Construct, id: string, props: AuthConstructProps) {
    super(scope, id);

    this.postRegistrationLambda = this.createPostRegistrationLambda(
      props.table
    );

    // Create user pool with post-confirmation trigger
    this.userPool = this.createUserPool();
    this.userPoolClient = this.createUserPoolClient();

    new CfnOutput(scope, 'UserPoolId', {
      value: this.userPool.userPoolId,
    });

    new CfnOutput(scope, 'UserPoolClientId', {
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

  private createPostRegistrationLambda(table: ITable) {
    const lambda = new NodejsFunction(this, 'PostRegistrationLambda', {
      runtime: Runtime.NODEJS_22_X,
      handler: 'handler',
      entry: 'src/auth/index.ts',
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    table.grantWriteData(lambda);

    return lambda;
  }
}
