import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';

export interface LambdaContext {
  tableName: string;
  bucketName: string;
  serviceName: string;
}

const context: LambdaContext = {
  tableName: process.env.TABLE_NAME!,
  bucketName: process.env.BUCKET_NAME!,
  serviceName: process.env.SERVICE_NAME!,
};

const logger = new Logger({ serviceName: context.serviceName });
const tracer = new Tracer();
const metrics = new Metrics();

export const getLogger = () => logger;
export const getTracer = () => tracer;
export const getMetrics = () => metrics;
export const getContext = () => context;
