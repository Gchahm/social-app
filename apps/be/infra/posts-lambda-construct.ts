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
        id: 'posts-create-post',
        entry: 'src/lambda/posts/create.ts',
        functionName: 'posts-CreatePost',
        description: 'Posts API: Create a new post',
      },
      {
        id: 'posts-get-post',
        entry: 'src/lambda/posts/get.ts',
        functionName: 'posts-GetPost',
        description: 'Posts API: Get a single post',
      },
      {
        id: 'posts-list-posts',
        entry: 'src/lambda/posts/list.ts',
        functionName: 'posts-ListPosts',
        description: 'Posts API: List posts with filters',
      },
      {
        id: 'posts-update-post',
        entry: 'src/lambda/posts/update.ts',
        functionName: 'posts-UpdatePost',
        description: 'Posts API: Update a post',
      },
      {
        id: 'posts-delete-post',
        entry: 'src/lambda/posts/delete.ts',
        functionName: 'posts-DeletePost',
        description: 'Posts API: Delete a post',
      },
      {
        id: 'posts-like-post',
        entry: 'src/lambda/posts/like.ts',
        functionName: 'posts-LikePost',
        description: 'Posts API: Like a post',
      },
      {
        id: 'posts-unlike-post',
        entry: 'src/lambda/posts/unlike.ts',
        functionName: 'posts-UnlikePost',
        description: 'Posts API: Unlike a post',
      },
      {
        id: 'posts-add-comment',
        entry: 'src/lambda/posts/add-comment.ts',
        functionName: 'posts-AddComment',
        description: 'Posts API: Add a comment',
      },
      {
        id: 'posts-get-comments',
        entry: 'src/lambda/posts/get-comments.ts',
        functionName: 'posts-GetComments',
        description: 'Posts API: Get comments for a post',
      },
      {
        id: 'posts-delete-comment',
        entry: 'src/lambda/posts/delete-comment.ts',
        functionName: 'posts-DeleteComment',
        description: 'Posts API: Delete a comment',
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
    };
  }
}
