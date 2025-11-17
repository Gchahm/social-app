import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { IFunction, Runtime } from 'aws-cdk-lib/aws-lambda';
import { ITable } from 'aws-cdk-lib/aws-dynamodb';
import { Integration, LambdaIntegration } from 'aws-cdk-lib/aws-apigateway';
import { IBucket } from 'aws-cdk-lib/aws-s3';

export interface LambdaConstructProps {
  table: ITable;
  bucket: IBucket;
}

export class LambdaConstruct extends Construct {
  public photosIntegration: Integration;

  constructor(scope: Construct, id: string, props: LambdaConstructProps) {
    super(scope, id);

    const { table, bucket } = props;

    const photos = new NodejsFunction(this, 'PhotosLambda', {
      runtime: Runtime.NODEJS_22_X,
      handler: 'handler',
      entry: 'src/photos/post.ts',
      environment: {
        TABLE_NAME: table.tableName,
        BUCKET_NAME: bucket.bucketName,
      },
    });

    table.grantReadWriteData(photos);
    bucket.grantReadWrite(photos);

    this.photosIntegration = new LambdaIntegration(photos);
  }
}
