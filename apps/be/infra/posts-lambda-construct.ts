import { Construct } from 'constructs';
import {
  BaseLambdaConstruct,
  BaseLambdaConstructProps,
} from './base-lambda-construct';
import { Integration } from 'aws-cdk-lib/aws-apigateway';

export interface PostsIntegrations {
  createPost: Integration;
  getPost: Integration;
  listPosts: Integration;
  updatePost: Integration;
  deletePost: Integration;
  likePost: Integration;
  unlikePost: Integration;
  addComment: Integration;
  getComments: Integration;
  deleteComment: Integration;
}

/**
 * Construct for managing all Posts-related Lambda functions
 * Includes: CRUD operations, likes, and comments
 */
export class PostsLambdaConstruct extends BaseLambdaConstruct {
  // Post CRUD operations
  public readonly postsIntegrations: PostsIntegrations;

  constructor(scope: Construct, id: string, props: BaseLambdaConstructProps) {
    super(scope, id, props);

    // Create all Lambda integrations using the batch method
    const integrations = this.createLambdaIntegrations([
      {
        id: 'CreatePost',
        entry: 'src/lambda/posts/create.ts',
        functionName: 'posts-CreatePost',
        description: 'Posts API: Create a new post',
      },
      {
        id: 'GetPost',
        entry: 'src/lambda/posts/get.ts',
        functionName: 'posts-GetPost',
        description: 'Posts API: Get a single post',
      },
      {
        id: 'ListPosts',
        entry: 'src/lambda/posts/list.ts',
        functionName: 'posts-ListPosts',
        description: 'Posts API: List posts with filters',
      },
      {
        id: 'UpdatePost',
        entry: 'src/lambda/posts/update.ts',
        functionName: 'posts-UpdatePost',
        description: 'Posts API: Update a post',
      },
      {
        id: 'DeletePost',
        entry: 'src/lambda/posts/delete.ts',
        functionName: 'posts-DeletePost',
        description: 'Posts API: Delete a post',
      },
      {
        id: 'LikePost',
        entry: 'src/lambda/posts/like.ts',
        functionName: 'posts-LikePost',
        description: 'Posts API: Like a post',
      },
      {
        id: 'UnlikePost',
        entry: 'src/lambda/posts/unlike.ts',
        functionName: 'posts-UnlikePost',
        description: 'Posts API: Unlike a post',
      },
      {
        id: 'AddComment',
        entry: 'src/lambda/posts/add-comment.ts',
        functionName: 'posts-AddComment',
        description: 'Posts API: Add a comment',
      },
      {
        id: 'GetComments',
        entry: 'src/lambda/posts/get-comments.ts',
        functionName: 'posts-GetComments',
        description: 'Posts API: Get comments for a post',
      },
      {
        id: 'DeleteComment',
        entry: 'src/lambda/posts/delete-comment.ts',
        functionName: 'posts-DeleteComment',
        description: 'Posts API: Delete a comment',
      },
    ]);

    this.postsIntegrations = {
      createPost: integrations.CreatePost,
      getPost: integrations.GetPost,
      listPosts: integrations.ListPosts,
      updatePost: integrations.UpdatePost,
      deletePost: integrations.DeletePost,
      likePost: integrations.LikePost,
      unlikePost: integrations.UnlikePost,
      addComment: integrations.AddComment,
      getComments: integrations.GetComments,
      deleteComment: integrations.DeleteComment,
    };
  }
}
