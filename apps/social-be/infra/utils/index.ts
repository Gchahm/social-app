import { App } from 'aws-cdk-lib';

export type Environment = 'dev' | 'staging' | 'prod';

export const getEnvironment = (app: App) => {
  return (app.node.tryGetContext('environment') as Environment) || 'dev';
};

export interface CustomDomainConfig {
  apiDomain: string;
  feDomain?: string;
  hostedZoneId?: string;
  hostedZoneName?: string;
  certificateArn?: string;
}

export const getDomain = (
  app: App,
  environment: Environment
): CustomDomainConfig => {
  const domainName = app.node.tryGetContext('domainName') as string;

  const feDomain =
    environment === 'prod' ? domainName : `${environment}-${domainName}`;

  return {
    apiDomain: `api-${feDomain}`,
    feDomain,
    hostedZoneId: app.node.tryGetContext('hostedZoneId') as string,
    hostedZoneName: app.node.tryGetContext('hostedZoneName') as string,
    certificateArn: app.node.tryGetContext('certificateArn') as string,
  };
};
