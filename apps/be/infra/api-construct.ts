import { Construct } from 'constructs';
import {
  CognitoUserPoolsAuthorizer,
  Cors,
  LambdaIntegration,
  MethodOptions,
  ResourceOptions,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import { PostsLambdas } from './posts-lambda-construct';
import { PhotosLambdas } from './photos-lambda-construct';
import { HealthLambdas } from './health-lambda-construct';
import { APP_NAME } from './constants';
import { EnvironmentConfig } from './configs';

export interface ApiConstructProps extends EnvironmentConfig {
  userPool: UserPool;
  postsLambdas?: PostsLambdas;
  photosLambdas?: PhotosLambdas;
  healthLambdas?: HealthLambdas;
  envName: string;
}

export class ApiConstruct extends Construct {
  public readonly api: RestApi;

  constructor(scope: Construct, id: string, props: ApiConstructProps) {
    super(scope, id);

    const {
      userPool,
      photosLambdas,
      postsLambdas,
      healthLambdas,
      corsOrigins,
      throttleRateLimit,
      throttleBurstLimit,
      envName,
    } = props;

    const gateway = new RestApi(this, `${APP_NAME}-${envName}`, {
      description: 'Full Stack App REST API',
      deployOptions: {
        throttlingRateLimit: throttleRateLimit,
        throttlingBurstLimit: throttleBurstLimit,
      },
    });
    this.api = gateway;

    const authorizer = new CognitoUserPoolsAuthorizer(this, 'authorizer', {
      cognitoUserPools: [userPool],
      identitySource: 'method.request.header.Authorization',
    });

    authorizer._attachToApi(gateway);

    const optionsWithAuthorizer: MethodOptions = {
      authorizationType: authorizer.authorizationType,
      authorizer,
    };

    const optionsWithCors: ResourceOptions = {
      defaultCorsPreflightOptions: {
        allowOrigins: corsOrigins,
        allowMethods: Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
      },
    };

    // Health check endpoint (no authentication required)
    const healthResource = gateway.root.addResource('health', optionsWithCors);
    healthResource.addMethod(
      'GET',
      new LambdaIntegration(healthLambdas.healthCheck)
    );

    // Photos endpoints
    const photosResource = gateway.root.addResource('photos', optionsWithCors);

    // POST /photos/upload-url - Request presigned URL
    const uploadUrlResource = photosResource.addResource('upload-url');
    uploadUrlResource.addMethod(
      'POST',
      new LambdaIntegration(photosLambdas.requestPhotoUploadUrl),
      optionsWithAuthorizer
    );

    // Posts endpoints
    const postsResource = gateway.root.addResource('posts', optionsWithCors);

    // POST /posts - Create post
    postsResource.addMethod(
      'POST',
      new LambdaIntegration(postsLambdas.createPost),
      optionsWithAuthorizer
    );

    // GET /posts - List posts (global feed or by user)
    postsResource.addMethod(
      'GET',
      new LambdaIntegration(postsLambdas.listPosts)
    );

    // /posts/:postId
    const postIdResource = postsResource.addResource('{postId}');

    // GET /posts/:postId - Get single post
    postIdResource.addMethod(
      'GET',
      new LambdaIntegration(postsLambdas.getPost)
    );

    // PUT /posts/:postId - Update post
    postIdResource.addMethod(
      'PUT',
      new LambdaIntegration(postsLambdas.updatePost),
      optionsWithAuthorizer
    );

    // DELETE /posts/:postId - Delete post
    postIdResource.addMethod(
      'DELETE',
      new LambdaIntegration(postsLambdas.deletePost),
      optionsWithAuthorizer
    );

    // /posts/:postId/like
    const likeResource = postIdResource.addResource('like');

    // POST /posts/:postId/like - Like post
    likeResource.addMethod(
      'POST',
      new LambdaIntegration(postsLambdas.likePost),
      optionsWithAuthorizer
    );

    // DELETE /posts/:postId/like - Unlike post
    likeResource.addMethod(
      'DELETE',
      new LambdaIntegration(postsLambdas.unlikePost),
      optionsWithAuthorizer
    );

    // /posts/:postId/comments
    const commentsResource = postIdResource.addResource('comments');

    // POST /posts/:postId/comments - Add comment
    commentsResource.addMethod(
      'POST',
      new LambdaIntegration(postsLambdas.addComment),
      optionsWithAuthorizer
    );

    // GET /posts/:postId/comments - Get comments
    commentsResource.addMethod(
      'GET',
      new LambdaIntegration(postsLambdas.getComments)
    );

    // /posts/:postId/comments/:commentId
    const commentIdResource = commentsResource.addResource('{commentId}');

    // DELETE /posts/:postId/comments/:commentId - Delete comment
    commentIdResource.addMethod(
      'DELETE',
      new LambdaIntegration(postsLambdas.deleteComment),
      optionsWithAuthorizer
    );
  }
}
