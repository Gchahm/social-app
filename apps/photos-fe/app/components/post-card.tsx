import {
  Avatar,
  AvatarFallback,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  Separator,
} from '@chahm/ui-components';
import { PostDto } from '@chahm/types';
import { Calendar, Heart, ImageIcon, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { useLikePost } from '../hooks';

interface PostCardProps {
  post: PostDto;
}

export function PostCard({ post }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const { mutate: toggleLike, isPending } = useLikePost();

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
        {post.caption && <CardDescription className="line-clamp-3">{post.caption}</CardDescription>}
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
          <div className="flex items-center gap-1.5">
            <MessageCircle className="h-4 w-4" />
            <span>{post.commentCount}</span>
          </div>
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
      </CardContent>
    </Card>
  );
}

export default PostCard;
