import { Construct } from 'constructs';
import { Certificate, ICertificate } from 'aws-cdk-lib/aws-certificatemanager';
import {
  ARecord,
  HostedZone,
  IHostedZone,
  RecordTarget,
} from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import {
  CachePolicy,
  Distribution,
  OriginAccessIdentity,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import { S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { CfnOutput } from 'aws-cdk-lib';
import { CustomDomainConfig } from './utils';

export interface FrontendDomainConstructProps extends CustomDomainConfig {
  bucket: Bucket;
  environment: string;
}

export class FrontendDomainConstruct extends Construct {
  public readonly distribution: Distribution;
  public readonly domainUrl: string;
  public readonly certificate?: ICertificate;
  public readonly hostedZone?: IHostedZone;

  constructor(
    scope: Construct,
    id: string,
    props: FrontendDomainConstructProps
  ) {
    super(scope, id);

    const { bucket, environment, ...customDomain } = props;

    // Create Origin Access Identity for CloudFront to access S3
    const originAccessIdentity = new OriginAccessIdentity(this, 'OAI', {
      comment: `OAI for ${environment} frontend`,
    });
    bucket.grantRead(originAccessIdentity);

    // Get or import hosted zone
    if (customDomain.hostedZoneId && customDomain.hostedZoneName) {
      this.hostedZone = HostedZone.fromHostedZoneAttributes(
        this,
        'HostedZone',
        {
          hostedZoneId: customDomain.hostedZoneId,
          zoneName: customDomain.hostedZoneName,
        }
      );
    }

    // Get or import certificate (must be in us-east-1 for CloudFront)
    if (customDomain.certificateArn) {
      this.certificate = Certificate.fromCertificateArn(
        this,
        'Certificate',
        customDomain.certificateArn
      );
    }

    // Build CloudFront distribution config
    const distributionProps: {
      defaultBehavior: {
        origin: S3BucketOrigin;
        viewerProtocolPolicy: ViewerProtocolPolicy;
        cachePolicy: CachePolicy;
      };
      defaultRootObject: string;
      errorResponses: Array<{
        httpStatus: number;
        responseHttpStatus: number;
        responsePagePath: string;
      }>;
      domainNames?: string[];
      certificate?: ICertificate;
    } = {
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessIdentity(bucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: 'index.html',
      // Handle SPA routing - return index.html for 404s
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    };

    // Add custom domain if certificate is available
    if (this.certificate && customDomain.feDomain) {
      distributionProps.domainNames = [customDomain.feDomain];
      distributionProps.certificate = this.certificate;
    }

    // Create CloudFront distribution
    this.distribution = new Distribution(
      this,
      'Distribution',
      distributionProps
    );

    // Set the URL based on whether custom domain is configured
    if (customDomain.feDomain && this.certificate) {
      this.domainUrl = `https://${customDomain.feDomain}`;

      // Create Route53 A record if we have a hosted zone
      if (this.hostedZone) {
        new ARecord(this, 'AliasRecord', {
          zone: this.hostedZone,
          recordName: customDomain.feDomain,
          target: RecordTarget.fromAlias(
            new CloudFrontTarget(this.distribution)
          ),
        });
      }

      new CfnOutput(this, 'CustomDomainUrl', {
        value: this.domainUrl,
        description: 'Custom domain URL for frontend',
      });
    } else {
      this.domainUrl = `https://${this.distribution.distributionDomainName}`;
    }

    new CfnOutput(this, 'CloudFrontUrl', {
      value: `https://${this.distribution.distributionDomainName}`,
      description: 'CloudFront distribution URL',
    });

    new CfnOutput(this, 'DistributionId', {
      value: this.distribution.distributionId,
      description: 'CloudFront distribution ID',
    });
  }
}
