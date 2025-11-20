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
