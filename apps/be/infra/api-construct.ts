import { Construct } from 'constructs';
import {
  CognitoUserPoolsAuthorizer,
  Integration,
  MethodOptions,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { UserPool } from 'aws-cdk-lib/aws-cognito';

export interface ApiConstructProps {
  spacesIntegration: Integration;
  userPool: UserPool;
}

export class ApiConstruct extends Construct {
  constructor(scope: Construct, id: string, props: ApiConstructProps) {
    super(scope, id);

    const { spacesIntegration, userPool } = props;

    const gateway = new RestApi(this, 'be-api');

    const authorizer = new CognitoUserPoolsAuthorizer(this, 'authorizer', {
      cognitoUserPools: [userPool],
      identitySource: 'method.request.header.Authorization',
    });

    authorizer._attachToApi(gateway);

    const optionsWithAuthorizer: MethodOptions = {
      authorizationType: authorizer.authorizationType,
      authorizer,
    };

    const resource = gateway.root.addResource('spaces');
    resource.addMethod('GET', spacesIntegration, optionsWithAuthorizer);
    resource.addMethod('POST', spacesIntegration, optionsWithAuthorizer);
  }
}
