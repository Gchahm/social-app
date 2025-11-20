import { PostDto } from './dto';

export * from './create';
export * from './add-comment';
export * from './update';
export * from './dto';

export interface GetPostsResponse {
  posts: PostDto[];
  count: number;
  lastEvaluatedKey?: string;
}

export interface GetPostResponse {
  post: PostDto;
}

export interface CommentDto {
  commentId: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
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
