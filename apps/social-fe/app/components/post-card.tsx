import {
  Avatar,
  AvatarFallback,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  Separator,
  Input,
} from '@chahm/ui-components';
import { PostDto } from '@chahm/types';
import { Calendar, Heart, ImageIcon, MessageCircle, Send } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { useLikePost, useComments, useAddComment } from '../hooks';

interface PostCardProps {
  post: PostDto;
}

export function PostCard({ post }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const { mutate: toggleLike, isPending } = useLikePost();
  const { data: commentsData, isLoading: isLoadingComments } = useComments({
    postId: post.postId,
    enabled: showComments,
  });
  const { mutate: addComment, isPending: isAddingComment } = useAddComment();

  const handleLikeClick = () => {
    if (isPending) return;

    toggleLike(
      { postId: post.postId, isLiked },
      {
        onSuccess: () => {
          setIsLiked(!isLiked);
        },
      }
    );
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isAddingComment) return;

    addComment(
      { postId: post.postId, content: commentText },
      {
        onSuccess: () => {
          setCommentText('');
        },
      }
    );
  };

  const getUserInitials = (username: string) => {
    return username
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <Link
          to={`/users/${post.userId}`}
          className="flex items-center gap-2 mb-3 hover:opacity-80 transition-opacity"
        >
          <Avatar>
            <AvatarFallback>{getUserInitials(post.username)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold text-sm">{post.username}</p>
          </div>
        </Link>
        <div className="aspect-square bg-muted rounded-md mb-3 flex items-center justify-center overflow-hidden">
          {post.imageUrl ? (
            <img
              src={post.imageUrl}
              alt={post.caption || 'Post'}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="w-12 h-12 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {post.caption && (
          <CardDescription className="line-clamp-3">
            {post.caption}
          </CardDescription>
        )}
        <Separator />
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleLikeClick}
            disabled={isPending}
            className="hover:text-red-500"
          >
            <Heart
              className={`h-4 w-4 transition-all ${
                isLiked ? 'fill-red-500 text-red-500' : ''
              }`}
            />
            <span className="ml-1.5">{post.likeCount}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setShowComments(!showComments)}
            className="hover:text-blue-500"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="ml-1.5">{post.commentCount}</span>
          </Button>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            {new Date(post.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        {showComments && (
          <>
            <Separator />
            <div className="space-y-3">
              <form onSubmit={handleAddComment} className="flex gap-2">
                <Input
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={isAddingComment}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!commentText.trim() || isAddingComment}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>

              {isLoadingComments ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Loading comments...
                </p>
              ) : commentsData?.comments && commentsData.comments.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {commentsData.comments.map((comment) => (
                    <div
                      key={comment.commentId}
                      className="text-sm space-y-1 pb-2 border-b last:border-b-0"
                    >
                      <div className="flex items-start gap-2">
                        <p className="font-semibold text-xs">
                          {comment.username}
                        </p>
                        <p className="text-foreground break-words flex-1">
                          {comment.content}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleDateString(
                          'en-US',
                          {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">
                  No comments yet. Be the first to comment!
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default PostCard;
