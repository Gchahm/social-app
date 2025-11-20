import { Construct } from 'constructs';
import {
  CognitoUserPoolsAuthorizer,
  Cors,
  MethodOptions,
  ResourceOptions,
  RestApi,
  ThrottleSettings,
} from 'aws-cdk-lib/aws-apigateway';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import { PostsIntegrations } from './posts-lambda-construct';
import { PhotosIntegrations } from './photos-lambda-construct';

export interface ApiConstructProps {
  userPool: UserPool;
  postsIntegrations?: PostsIntegrations;
  photosIntegrations?: PhotosIntegrations;
  corsOrigins: string[];
  throttleRateLimit: number;
  throttleBurstLimit: number;
}

export class ApiConstruct extends Construct {
  public readonly api: RestApi;

  constructor(scope: Construct, id: string, props: ApiConstructProps) {
    super(scope, id);

    const {
      userPool,
      photosIntegrations,
      postsIntegrations,
      corsOrigins,
      throttleRateLimit,
      throttleBurstLimit,
    } = props;

    const gateway = new RestApi(this, 'be-api', {
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

    // Photos endpoints
    const photosResource = gateway.root.addResource('photos', optionsWithCors);

    // POST /photos/upload-url - Request presigned URL
    const uploadUrlResource = photosResource.addResource('upload-url');
    uploadUrlResource.addMethod(
      'POST',
      photosIntegrations.requestPhotoUploadUrl,
      optionsWithAuthorizer
    );

    // Posts endpoints
    const postsResource = gateway.root.addResource('posts', optionsWithCors);

    // POST /posts - Create post
    postsResource.addMethod(
      'POST',
      postsIntegrations.createPost,
      optionsWithAuthorizer
    );

    // GET /posts - List posts (global feed or by user)
    postsResource.addMethod('GET', postsIntegrations.listPosts);

    // /posts/:postId
    const postIdResource = postsResource.addResource('{postId}');

    // GET /posts/:postId - Get single post
    postIdResource.addMethod('GET', postsIntegrations.getPost);

    // PUT /posts/:postId - Update post
    postIdResource.addMethod(
      'PUT',
      postsIntegrations.updatePost,
      optionsWithAuthorizer
    );

    // DELETE /posts/:postId - Delete post
    postIdResource.addMethod(
      'DELETE',
      postsIntegrations.deletePost,
      optionsWithAuthorizer
    );

    // /posts/:postId/like
    const likeResource = postIdResource.addResource('like');

    // POST /posts/:postId/like - Like post
    likeResource.addMethod(
      'POST',
      postsIntegrations.likePost,
      optionsWithAuthorizer
    );

    // DELETE /posts/:postId/like - Unlike post
    likeResource.addMethod(
      'DELETE',
      postsIntegrations.unlikePost,
      optionsWithAuthorizer
    );

    // /posts/:postId/comments
    const commentsResource = postIdResource.addResource('comments');

    // POST /posts/:postId/comments - Add comment
    commentsResource.addMethod(
      'POST',
      postsIntegrations.addComment,
      optionsWithAuthorizer
    );

    // GET /posts/:postId/comments - Get comments
    commentsResource.addMethod('GET', postsIntegrations.getComments);

    // /posts/:postId/comments/:commentId
    const commentIdResource = commentsResource.addResource('{commentId}');

    // DELETE /posts/:postId/comments/:commentId - Delete comment
    commentIdResource.addMethod(
      'DELETE',
      postsIntegrations.deleteComment,
      optionsWithAuthorizer
    );
  }
}
