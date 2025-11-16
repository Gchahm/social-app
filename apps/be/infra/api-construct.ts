import { Construct } from 'constructs';
import { Integration, RestApi } from 'aws-cdk-lib/aws-apigateway';

export interface ApiConstructProps {
  helloIntegration: Integration;
}

export class ApiConstruct extends Construct {
  constructor(scope: Construct, id: string, props: ApiConstructProps) {
    super(scope, id);

    const { helloIntegration } = props;

    const gateway = new RestApi(this, 'be-api');
    const resource = gateway.root.addResource('hello');
    resource.addMethod('GET', helloIntegration);
  }
}
