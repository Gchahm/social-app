import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { join } from 'path';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3';

export class UiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const uiDir = join(__dirname, '..', 'dist');

    const uiCodeBucket = new Bucket(this, 'UIBucket', {
      bucketName: `sample-app-bucket-${this.account}`,
      publicReadAccess: true,
      blockPublicAccess: new BlockPublicAccess({
        blockPublicAcls: false,
        ignorePublicAcls: false,
        blockPublicPolicy: false,
        restrictPublicBuckets: false,
      }),
      websiteIndexDocument: 'index.html',
    });

    new BucketDeployment(this, 'UIBucketDeployment', {
      destinationBucket: uiCodeBucket,
      sources: [Source.asset(uiDir)],
    });

    new CfnOutput(this, 'UIDeploymentS3Url', {
      value: uiCodeBucket.bucketWebsiteUrl,
    });
  }
}
