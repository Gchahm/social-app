import { APIGatewayProxyEventSchema } from '@aws-lambda-powertools/parser/lib/esm/schemas/api-gateway';
import { z } from 'zod/index';

export type ApiGatewayProxyEventType = z.infer<
  typeof APIGatewayProxyEventSchema
>;
