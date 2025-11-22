import { Construct } from 'constructs';
import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  Cors,
  LambdaIntegration,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import { PostsLambdas } from './posts-lambda-construct';
import { PhotosLambdas } from './photos-lambda-construct';
import { HealthLambdas } from './health-lambda-construct';
import { APP_NAME } from './constants';
import { EnvironmentConfig } from './configs';
import { CfnOutput } from 'aws-cdk-lib';

export interface ApiConstructProps extends EnvironmentConfig {
  userPool: UserPool;
  postsLambdas?: PostsLambdas;
  photosLambdas?: PhotosLambdas;
  healthLambdas?: HealthLambdas;
  envName: string;
}

export class ApiConstruct extends Construct {
  public readonly api: RestApi;

  constructor(scope: Construct, id: string, public props: ApiConstructProps) {
    super(scope, id);

    const {
      userPool,
      corsOrigins,
      throttleRateLimit,
      throttleBurstLimit,
      envName,
    } = props;

    const authorizer = new CognitoUserPoolsAuthorizer(this, 'authorizer', {
      cognitoUserPools: [userPool],
      identitySource: 'method.request.header.Authorization',
    });

    this.api = new RestApi(this, `${APP_NAME}-${envName}`, {
      description: 'Full Stack App REST API',
      deployOptions: {
        throttlingRateLimit: throttleRateLimit,
        throttlingBurstLimit: throttleBurstLimit,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: corsOrigins,
        allowMethods: Cors.ALL_METHODS,
        allowHeaders: Cors.DEFAULT_HEADERS,
      },
      defaultMethodOptions: {
        authorizationType: authorizer.authorizationType,
        authorizer,
      },
    });

    authorizer._attachToApi(this.api);

    this.addHealthEndpoints();
    this.addPhotosEndpoints();
    this.addPostsEndpoints();

    new CfnOutput(scope, 'ApiEndpoint', {
      value: this.api.url,
      description: 'API Gateway endpoint URL',
      exportName: `ApiEndpoint`,
    });
  }

  private addHealthEndpoints() {
    const healthResource = this.api.root.addResource('health');
    healthResource.addMethod(
      'GET',
      new LambdaIntegration(this.props.healthLambdas.healthCheck),
      {
        authorizationType: AuthorizationType.NONE,
      }
    );
  }

  private addPhotosEndpoints() {
    // Photos endpoints
    const photosResource = this.api.root.addResource('photos');

    // POST /photos/upload-url - Request presigned URL
    const uploadUrlResource = photosResource.addResource('upload-url');
    uploadUrlResource.addMethod(
      'POST',
      new LambdaIntegration(this.props.photosLambdas.requestPhotoUploadUrl)
    );
  }

  private addPostsEndpoints() {
    // Posts endpoints
    const postsResource = this.api.root.addResource('posts');

    // POST /posts - Create post
    postsResource.addMethod(
      'POST',
      new LambdaIntegration(this.props.postsLambdas.createPost)
    );

    // GET /posts - List posts (global feed or by user)
    postsResource.addMethod(
      'GET',
      new LambdaIntegration(this.props.postsLambdas.listPosts)
    );

    // /posts/:postId
    const postIdResource = postsResource.addResource('{postId}');

    // GET /posts/:postId - Get single post
    postIdResource.addMethod(
      'GET',
      new LambdaIntegration(this.props.postsLambdas.getPost)
    );

    // PUT /posts/:postId - Update post
    postIdResource.addMethod(
      'PUT',
      new LambdaIntegration(this.props.postsLambdas.updatePost)
    );

    // DELETE /posts/:postId - Delete post
    postIdResource.addMethod(
      'DELETE',
      new LambdaIntegration(this.props.postsLambdas.deletePost)
    );

    // /posts/:postId/like
    const likeResource = postIdResource.addResource('like');

    // POST /posts/:postId/like - Like post
    likeResource.addMethod(
      'POST',
      new LambdaIntegration(this.props.postsLambdas.likePost)
    );

    // DELETE /posts/:postId/like - Unlike post
    likeResource.addMethod(
      'DELETE',
      new LambdaIntegration(this.props.postsLambdas.unlikePost)
    );

    // /posts/:postId/comments
    const commentsResource = postIdResource.addResource('comments');

    // POST /posts/:postId/comments - Add comment
    commentsResource.addMethod(
      'POST',
      new LambdaIntegration(this.props.postsLambdas.addComment)
    );

    // GET /posts/:postId/comments - Get comments
    commentsResource.addMethod(
      'GET',
      new LambdaIntegration(this.props.postsLambdas.getComments)
    );

    // /posts/:postId/comments/:commentId
    const commentIdResource = commentsResource.addResource('{commentId}');

    // DELETE /posts/:postId/comments/:commentId - Delete comment
    commentIdResource.addMethod(
      'DELETE',
      new LambdaIntegration(this.props.postsLambdas.deleteComment)
    );
  }
}
