import { Construct } from 'constructs';
import { Certificate, ICertificate } from 'aws-cdk-lib/aws-certificatemanager';
import {
  IHostedZone,
  HostedZone,
  ARecord,
  RecordTarget,
} from 'aws-cdk-lib/aws-route53';
import { ApiGatewayDomain } from 'aws-cdk-lib/aws-route53-targets';
import { DomainName, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { CfnOutput } from 'aws-cdk-lib';
import { CustomDomainConfig } from './utils';

export interface DomainConstructProps extends CustomDomainConfig {
  api: RestApi;
  environment: string;
}

export class DomainConstruct extends Construct {
  public readonly domainName?: DomainName;
  public readonly certificate?: ICertificate;
  public readonly hostedZone?: IHostedZone;

  constructor(scope: Construct, id: string, props: DomainConstructProps) {
    super(scope, id);

    const { api, ...customDomain } = props;

    // Skip if no custom domain configuration
    if (!customDomain?.apiDomain) {
      return;
    }

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

    // Get or import certificate
    if (customDomain.certificateArn) {
      this.certificate = Certificate.fromCertificateArn(
        this,
        'Certificate',
        customDomain.certificateArn
      );
    }

    // Only create domain if we have a certificate
    if (this.certificate) {
      // Create custom domain for API Gateway
      this.domainName = new DomainName(this, 'CustomDomain', {
        domainName: customDomain.apiDomain,
        certificate: this.certificate,
      });

      new CfnOutput(this, 'CustomDomainApiUrl', {
        value: `https://${customDomain.apiDomain}`,
        description: 'Custom domain URL for API',
        exportName: `CustomDomainApiUrl`,
      });
      // Attach the API to the custom domain
      this.domainName.addBasePathMapping(api, {
        basePath: '',
      });

      // Create Route53 A record if we have a hosted zone
      if (this.hostedZone) {
        new ARecord(this, 'AliasRecord', {
          zone: this.hostedZone,
          recordName: customDomain.apiDomain,
          target: RecordTarget.fromAlias(new ApiGatewayDomain(this.domainName)),
        });
      }
    }
  }
}
