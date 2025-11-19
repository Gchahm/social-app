import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { ITable } from 'aws-cdk-lib/aws-dynamodb';
import { Integration, LambdaIntegration } from 'aws-cdk-lib/aws-apigateway';
import { Duration } from 'aws-cdk-lib';

export interface PostsLambdaConstructProps {
  table: ITable;
}

/**
 * Construct for managing all Posts-related Lambda functions
 * Includes: CRUD operations, likes, and comments
 */
export class PostsLambdaConstruct extends Construct {
  // Post CRUD operations
  public readonly createPostIntegration: Integration;
  public readonly getPostIntegration: Integration;
  public readonly listPostsIntegration: Integration;
  public readonly updatePostIntegration: Integration;
  public readonly deletePostIntegration: Integration;

  // Like operations
  public readonly likePostIntegration: Integration;
  public readonly unlikePostIntegration: Integration;

  // Comment operations
  public readonly addCommentIntegration: Integration;
  public readonly getCommentsIntegration: Integration;
  public readonly deleteCommentIntegration: Integration;

  constructor(scope: Construct, id: string, props: PostsLambdaConstructProps) {
    super(scope, id);

    const { table } = props;

    // Common Lambda configuration
    const commonConfig = {
      runtime: Runtime.NODEJS_22_X,
      handler: 'handler',
      timeout: Duration.seconds(30),
      memorySize: 256,
      environment: {
        TABLE_NAME: table.tableName,
      },
      bundling: {
        minify: true,
        sourceMap: true,
        externalModules: ['@aws-sdk/*'], // AWS SDK v3 is included in Lambda runtime
      },
    };

    // Create Post
    this.createPostIntegration = this.createPostLambda(
      'CreatePost',
      'src/posts/create.ts',
      table,
      commonConfig
    );

    // Get Post
    this.getPostIntegration = this.createPostLambda(
      'GetPost',
      'src/posts/get.ts',
      table,
      commonConfig
    );

    // List Posts
    this.listPostsIntegration = this.createPostLambda(
      'ListPosts',
      'src/posts/list.ts',
      table,
      commonConfig
    );

    // Update Post
    this.updatePostIntegration = this.createPostLambda(
      'UpdatePost',
      'src/posts/update.ts',
      table,
      commonConfig
    );

    // Delete Post
    this.deletePostIntegration = this.createPostLambda(
      'DeletePost',
      'src/posts/delete.ts',
      table,
      commonConfig
    );

    // Like Post
    this.likePostIntegration = this.createPostLambda(
      'LikePost',
      'src/posts/like.ts',
      table,
      commonConfig
    );

    // Unlike Post
    this.unlikePostIntegration = this.createPostLambda(
      'UnlikePost',
      'src/posts/unlike.ts',
      table,
      commonConfig
    );

    // Add Comment
    this.addCommentIntegration = this.createPostLambda(
      'AddComment',
      'src/posts/add-comment.ts',
      table,
      commonConfig
    );

    // Get Comments
    this.getCommentsIntegration = this.createPostLambda(
      'GetComments',
      'src/posts/get-comments.ts',
      table,
      commonConfig
    );

    // Delete Comment
    this.deleteCommentIntegration = this.createPostLambda(
      'DeleteComment',
      'src/posts/delete-comment.ts',
      table,
      commonConfig
    );
  }

  /**
   * Helper method to create a Lambda function and integration
   */
  private createPostLambda(
    id: string,
    entry: string,
    table: ITable,
    config: any
  ): Integration {
    const lambdaFn = new NodejsFunction(this, id, {
      ...config,
      entry,
      functionName: `posts-${id}`,
      description: `Posts API: ${id}`,
    });

    // Grant DynamoDB permissions
    table.grantReadWriteData(lambdaFn);

    // Create and return API Gateway integration
    return new LambdaIntegration(lambdaFn, {
      proxy: true,
      allowTestInvoke: true,
    });
  }
}
