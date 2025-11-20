import { Construct } from 'constructs';
import { UserPool, UserPoolClient } from 'aws-cdk-lib/aws-cognito';
import { RemovalPolicy } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { ITable } from 'aws-cdk-lib/aws-dynamodb';
import { Environment } from './be-stack';

export interface AuthConstructProps {
  table: ITable;
  environment: Environment;
}

export class AuthConstruct extends Construct {
  public userPool: UserPool;
  public userPoolClient: UserPoolClient;
  public postRegistrationLambda: NodejsFunction;

  constructor(scope: Construct, id: string, props: AuthConstructProps) {
    super(scope, id);

    this.postRegistrationLambda = this.createPostRegistrationLambda(
      props.table,
      props.environment
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
        postConfirmation: this.postRegistrationLambda,
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

  private createPostRegistrationLambda(table: ITable, environment: Environment) {
    const lambda = new NodejsFunction(this, 'PostRegistrationLambda', {
      runtime: Runtime.NODEJS_22_X,
      handler: 'handler',
      entry: 'src/lambda/auth/post-registration.ts',
      environment: {
        TABLE_NAME: table.tableName,
        ENVIRONMENT: environment,
      },
    });

    table.grantWriteData(lambda);

    return lambda;
  }
}
