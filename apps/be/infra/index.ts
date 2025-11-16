import { App } from 'aws-cdk-lib';
import { BeStack } from './be-stack';

const app = new App();
new BeStack(app, 'BEStack');
