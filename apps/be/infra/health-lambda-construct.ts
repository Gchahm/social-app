import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import {
  BaseLambdaConstruct,
  BaseLambdaConstructProps,
} from './base-lambda-construct';
import { APP_NAME } from './constants';

export interface HealthLambdas {
  healthCheck: NodejsFunction;
}

/**
 * Construct for managing health check Lambda function
 */
export class HealthLambdaConstruct extends BaseLambdaConstruct {
  public readonly lambdas: HealthLambdas;

  constructor(scope: Construct, id: string, props: BaseLambdaConstructProps) {
    super(scope, id, props);

    this.lambdas = {
      healthCheck: this.createLambdaFunction(
        'HealthCheck',
        'src/lambda/health/index.ts',
        {
          functionName: 'health-check',
          description: 'Health check endpoint',
        }
      ),
    };
  }
}
