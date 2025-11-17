import { Construct } from 'constructs';
import { Bucket } from 'aws-cdk-lib/aws-s3';

export class StorageConstruct extends Construct {
  public bucket: Bucket;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.bucket = new Bucket(this, 'PhotosBucket');
  }
}
