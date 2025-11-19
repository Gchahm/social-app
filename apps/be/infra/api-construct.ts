import { Construct } from 'constructs';
import {
  CognitoUserPoolsAuthorizer,
  Cors,
  Integration,
  MethodOptions,
  ResourceOptions,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { UserPool } from 'aws-cdk-lib/aws-cognito';

export interface ApiConstructProps {
  userPool: UserPool;
  // Photos integrations
  requestPhotoUploadUrlIntegration: Integration;
  confirmPhotoUploadIntegration: Integration;
  getPhotosIntegration: Integration;
  uploadPhotoIntegration: Integration;
  // Posts integrations
  createPostIntegration: Integration;
  getPostIntegration: Integration;
  listPostsIntegration: Integration;
  updatePostIntegration: Integration;
  deletePostIntegration: Integration;
  likePostIntegration: Integration;
  unlikePostIntegration: Integration;
  addCommentIntegration: Integration;
  getCommentsIntegration: Integration;
  deleteCommentIntegration: Integration;
}

export class ApiConstruct extends Construct {
  public readonly api: RestApi;

  constructor(scope: Construct, id: string, props: ApiConstructProps) {
    super(scope, id);

    const {
      userPool,
      requestPhotoUploadUrlIntegration,
      confirmPhotoUploadIntegration,
      getPhotosIntegration,
      uploadPhotoIntegration,
      createPostIntegration,
      getPostIntegration,
      listPostsIntegration,
      updatePostIntegration,
      deletePostIntegration,
      likePostIntegration,
      unlikePostIntegration,
      addCommentIntegration,
      getCommentsIntegration,
      deleteCommentIntegration,
    } = props;

    const gateway = new RestApi(this, 'be-api');
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
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
      },
    };

    // Photos endpoints
    const photosResource = gateway.root.addResource('photos', optionsWithCors);

    // POST /photos/upload-url - Request presigned URL (recommended flow)
    const uploadUrlResource = photosResource.addResource('upload-url');
    uploadUrlResource.addMethod(
      'POST',
      requestPhotoUploadUrlIntegration,
      optionsWithAuthorizer
    );

    // POST /photos/confirm - Confirm upload and save metadata
    const confirmResource = photosResource.addResource('confirm');
    confirmResource.addMethod(
      'POST',
      confirmPhotoUploadIntegration,
      optionsWithAuthorizer
    );

    // GET /photos - List/get photos
    photosResource.addMethod('GET', getPhotosIntegration, optionsWithAuthorizer);

    // POST /photos - Direct upload (legacy, for backward compatibility)
    photosResource.addMethod('POST', uploadPhotoIntegration, optionsWithAuthorizer);

    // Posts endpoints
    const postsResource = gateway.root.addResource('posts', optionsWithCors);

    // POST /posts - Create post
    postsResource.addMethod(
      'POST',
      createPostIntegration,
      optionsWithAuthorizer
    );

    // GET /posts - List posts (global feed or by user)
    postsResource.addMethod('GET', listPostsIntegration);

    // /posts/:postId
    const postIdResource = postsResource.addResource('{postId}');

    // GET /posts/:postId - Get single post
    postIdResource.addMethod('GET', getPostIntegration);

    // PUT /posts/:postId - Update post
    postIdResource.addMethod(
      'PUT',
      updatePostIntegration,
      optionsWithAuthorizer
    );

    // DELETE /posts/:postId - Delete post
    postIdResource.addMethod(
      'DELETE',
      deletePostIntegration,
      optionsWithAuthorizer
    );

    // /posts/:postId/like
    const likeResource = postIdResource.addResource('like');

    // POST /posts/:postId/like - Like post
    likeResource.addMethod('POST', likePostIntegration, optionsWithAuthorizer);

    // DELETE /posts/:postId/like - Unlike post
    likeResource.addMethod(
      'DELETE',
      unlikePostIntegration,
      optionsWithAuthorizer
    );

    // /posts/:postId/comments
    const commentsResource = postIdResource.addResource('comments');

    // POST /posts/:postId/comments - Add comment
    commentsResource.addMethod(
      'POST',
      addCommentIntegration,
      optionsWithAuthorizer
    );

    // GET /posts/:postId/comments - Get comments
    commentsResource.addMethod('GET', getCommentsIntegration);

    // /posts/:postId/comments/:commentId
    const commentIdResource = commentsResource.addResource('{commentId}');

    // DELETE /posts/:postId/comments/:commentId - Delete comment
    commentIdResource.addMethod(
      'DELETE',
      deleteCommentIntegration,
      optionsWithAuthorizer
    );
  }
}
