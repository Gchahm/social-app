import { createPostSchema } from '@chahm/types';
import { v4 as uuidv4 } from 'uuid';
import { APIGatewayProxyEventSchema } from '@aws-lambda-powertools/parser/schemas/api-gateway';
import { z } from 'zod';
import { getUserId } from '../utils';
import { createPost, incrementPostCount } from '../../database';
import { createApiHandler } from '../middleware/apiHandler';

const createPostEvent = APIGatewayProxyEventSchema.extend({
  body: createPostSchema,
});

type PostPhotoEventType = z.infer<typeof createPostEvent>;

export const handler = createApiHandler(createPostEvent).handler(
  async (event: PostPhotoEventType) => {
    const userId = getUserId(event);
    const body = event.body;

    // Construct URL from S3 key
    const bucketName = process.env.BUCKET_NAME;
    const region = process.env.AWS_REGION;
    const imageUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${body.imageKey}`;

    const postId = uuidv4();

    // Create the post
    const post = await createPost({
      postId,
      userId,
      imageUrl,
      caption: body.caption,
    });

    // Increment user's post count
    await incrementPostCount(userId, 1);

    return {
      statusCode: 201,
      body: {
        message: 'Post created successfully',
        post,
      },
    };
  });
