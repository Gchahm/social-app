import { App } from 'aws-cdk-lib';
import { UiStack } from './ui-stack';

const app = new App();
new UiStack(app, 'UIStack');
