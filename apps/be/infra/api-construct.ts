import { Construct } from 'constructs';
import {
  CognitoUserPoolsAuthorizer,
  Cors,
  Integration,
  MethodOptions,
  ResourceOptions,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { UserPool } from 'aws-cdk-lib/aws-cognito';

export interface ApiConstructProps {
  spacesIntegration: Integration;
  userPool: UserPool;
}

export class ApiConstruct extends Construct {
  public readonly api: RestApi;

  constructor(scope: Construct, id: string, props: ApiConstructProps) {
    super(scope, id);

    const { spacesIntegration, userPool } = props;

    const gateway = new RestApi(this, 'be-api');
    this.api = gateway;

    const authorizer = new CognitoUserPoolsAuthorizer(this, 'authorizer', {
      cognitoUserPools: [userPool],
      identitySource: 'method.request.header.Authorization',
    });

    authorizer._attachToApi(gateway);

    const optionsWithAuthorizer: MethodOptions = {
      authorizationType: authorizer.authorizationType,
      authorizer,
    };

    const optionsWithCors: ResourceOptions = {
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
      },
    };

    const resource = gateway.root.addResource('photos', optionsWithCors);
    resource.addMethod('GET', spacesIntegration, optionsWithAuthorizer);
    resource.addMethod('POST', spacesIntegration, optionsWithAuthorizer);
  }
}
