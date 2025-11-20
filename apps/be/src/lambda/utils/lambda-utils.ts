export interface LambdaContext {
  tableName: string;
  bucketName: string;
}

export function getContext(): LambdaContext {
  return {
    tableName: process.env.TABLE_NAME!,
    bucketName: process.env.BUCKET_NAME!,
  };
}
