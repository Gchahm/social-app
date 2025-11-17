import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { ITable } from 'aws-cdk-lib/aws-dynamodb';
import { Integration, LambdaIntegration } from 'aws-cdk-lib/aws-apigateway';
import { IBucket } from 'aws-cdk-lib/aws-s3';

export interface LambdaConstructProps {
  table: ITable;
  bucket: IBucket;
}

export class LambdaConstruct extends Construct {
  public spacesIntegration: Integration;

  constructor(scope: Construct, id: string, props: LambdaConstructProps) {
    super(scope, id);

    const { table, bucket } = props;

    const spacesLambda = new NodejsFunction(this, 'SpacesLambda', {
      runtime: Runtime.NODEJS_22_X,
      handler: 'handler',
      entry: 'src/photos/index.ts',
      environment: {
        TABLE_NAME: table.tableName,
        BUCKET_NAME: bucket.bucketName,
      },
    });

    table.grantReadWriteData(spacesLambda);
    bucket.grantReadWrite(spacesLambda);

    this.spacesIntegration = new LambdaIntegration(spacesLambda);
  }
}
