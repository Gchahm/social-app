export interface ILambdaEnvironmentVariables extends Record<string, string> {
  TABLE_NAME: string;
  BUCKET_NAME: string;
  SERVICE_NAME: string;
}
