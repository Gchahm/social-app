export interface PostDto {
  postId: string;
  userId: string;
  imageUrl: string;
  caption?: string;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt: string;
}
