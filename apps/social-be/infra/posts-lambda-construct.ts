import { Construct } from 'constructs';
import {
  BaseLambdaConstruct,
  BaseLambdaConstructProps,
} from './base-lambda-construct';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export interface PostsLambdas {
  createPost: NodejsFunction;
  getPost: NodejsFunction;
  listPosts: NodejsFunction;
  updatePost: NodejsFunction;
  deletePost: NodejsFunction;
  likePost: NodejsFunction;
  unlikePost: NodejsFunction;
  addComment: NodejsFunction;
  getComments: NodejsFunction;
  deleteComment: NodejsFunction;
  requestPhotoUploadUrl: NodejsFunction;
}

/**
 * Construct for managing all Posts-related Lambda functions
 * Includes: CRUD operations, likes, and comments
 */
export class PostsLambdaConstruct extends BaseLambdaConstruct {
  // Post CRUD operations
  public readonly lambdas: PostsLambdas;

  constructor(scope: Construct, id: string, props: BaseLambdaConstructProps) {
    super(scope, id, props);

    // Create all Lambda functions using the batch method
    const functions = this.createLambdaFunctions([
      {
        id: 'CreatePost',
        entry: 'src/lambda/posts/create.ts',
        functionName: 'posts-create-post',
        description: 'Posts API: Create a new post',
      },
      {
        id: 'GetPost',
        entry: 'src/lambda/posts/get.ts',
        functionName: 'posts-get-post',
        description: 'Posts API: Get a single post',
      },
      {
        id: 'ListPosts',
        entry: 'src/lambda/posts/list.ts',
        functionName: 'posts-list-posts',
        description: 'Posts API: List posts with filters',
      },
      {
        id: 'UpdatePost',
        entry: 'src/lambda/posts/update.ts',
        functionName: 'posts-update-post',
        description: 'Posts API: Update a post',
      },
      {
        id: 'DeletePost',
        entry: 'src/lambda/posts/delete.ts',
        functionName: 'posts-delete-post',
        description: 'Posts API: Delete a post',
      },
      {
        id: 'LikePost',
        entry: 'src/lambda/posts/like.ts',
        functionName: 'posts-like-post',
        description: 'Posts API: Like a post',
      },
      {
        id: 'UnlikePost',
        entry: 'src/lambda/posts/unlike.ts',
        functionName: 'posts-unlike-post',
        description: 'Posts API: Unlike a post',
      },
      {
        id: 'AddComment',
        entry: 'src/lambda/posts/add-comment.ts',
        functionName: 'posts-add-comment',
        description: 'Posts API: Add a comment',
      },
      {
        id: 'GetComments',
        entry: 'src/lambda/posts/get-comments.ts',
        functionName: 'posts-get-comments',
        description: 'Posts API: Get comments for a post',
      },
      {
        id: 'DeleteComment',
        entry: 'src/lambda/posts/delete-comment.ts',
        functionName: 'posts-delete-comment',
        description: 'Posts API: Delete a comment',
      },
      {
        id: 'RequestPhotoUploadUrl',
        entry: 'src/lambda/posts/request-upload-url.ts',
        functionName: 'request-upload-url',
        description: 'Posts API: request upload url',
      },
    ]);

    this.lambdas = {
      createPost: functions.CreatePost,
      getPost: functions.GetPost,
      listPosts: functions.ListPosts,
      updatePost: functions.UpdatePost,
      deletePost: functions.DeletePost,
      likePost: functions.LikePost,
      unlikePost: functions.UnlikePost,
      addComment: functions.AddComment,
      getComments: functions.GetComments,
      deleteComment: functions.DeleteComment,
      requestPhotoUploadUrl: functions.RequestPhotoUploadUrl,
    };
  }
}
