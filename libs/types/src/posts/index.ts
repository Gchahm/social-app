export * from './create';

export interface PostDto {
  postId: string;
  userId: string;
  imageUrl: string;
  caption?: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GetPostsResponse {
  posts: PostDto[];
  count: number;
  lastEvaluatedKey?: string;
}

export interface GetPostResponse {
  post: PostDto;
}

export interface LikePostResponse {
  message: string;
  like: {
    postId: string;
    userId: string;
    createdAt: string;
  };
}

export interface UnlikePostResponse {
  message: string;
}

export interface CommentDto {
  commentId: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddCommentPayload {
  content: string;
}

export interface AddCommentResponse {
  message: string;
  comment: CommentDto;
}

export interface GetCommentsResponse {
  comments: CommentDto[];
  count: number;
  lastEvaluatedKey?: string;
}

export interface DeleteCommentResponse {
  message: string;
}

export interface DeletePostResponse {
  message: string;
}

export interface UpdatePostPayload {
  caption?: string;
}

export interface UpdatePostResponse {
  message: string;
  post: PostDto;
}
