import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3';
import {
  FrontendDomainConstruct,
} from './frontend-domain-construct';
import { APP_NAME } from './constants';
import { CustomDomainConfig } from './utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface UiStackProps extends StackProps {
  environment: string;
  customDomain?: CustomDomainConfig;
}

export class UiStack extends Stack {
  constructor(scope: Construct, id: string, props: UiStackProps) {
    super(scope, id, props);

    const { environment, customDomain } = props;
    const uiDir = join(__dirname, '..', 'build', 'client');

    // S3 bucket for static assets - private, accessed via CloudFront OAI
    const uiCodeBucket = new Bucket(this, 'UIBucket', {
      bucketName: `${APP_NAME}-fe-${environment}-${this.account}`,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    });

    // Deploy static assets to S3
    new BucketDeployment(this, 'UIBucketDeployment', {
      destinationBucket: uiCodeBucket,
      sources: [Source.asset(uiDir)],
    });

    // Create CloudFront distribution with optional custom domain
    const frontendDomain = new FrontendDomainConstruct(this, 'FrontendDomain', {
      bucket: uiCodeBucket,
      environment,
      ...customDomain,
    });

    // Output the website URL (custom domain if configured, otherwise CloudFront)
    new CfnOutput(this, 'WebsiteUrl', {
      value: frontendDomain.domainUrl,
      description: 'Website URL',
    });
  }
}
