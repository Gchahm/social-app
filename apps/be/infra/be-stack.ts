import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';

export class BeStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const heloLambda = new NodejsFunction(this, 'hello-lambda', {
      runtime: Runtime.NODEJS_22_X,
      handler: 'helloHandler',
      entry: 'src/index.ts',
    });

    const helloLambdaIntegration = new LambdaIntegration(heloLambda);

    const gateway = new RestApi(this, 'be-api');
    const resource = gateway.root.addResource('hello');
    resource.addMethod('GET', helloLambdaIntegration);
  }
}
