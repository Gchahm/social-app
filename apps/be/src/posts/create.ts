import { createPostSchema } from '@chahm/types';
import { v4 as uuidv4 } from 'uuid';
import { APIGatewayProxyEventSchema } from '@aws-lambda-powertools/parser/schemas/api-gateway';
import { z } from 'zod';
import middy from '@middy/core';
import httpEventNormalizerMiddleware from '@middy/http-event-normalizer';
import httpHeaderNormalizerMiddleware from '@middy/http-header-normalizer';
import httpJsonBodyParserMiddleware from '@middy/http-json-body-parser';
import { parser } from '@aws-lambda-powertools/parser/middleware';
import httpErrorHandler from '@middy/http-error-handler';
import { getUserId } from '../utils';
import { createPost, incrementPostCount } from '../database';
import httpCorsMiddleware from '@middy/http-cors';
import httpResponseSerializerMiddleware from '@middy/http-response-serializer';
import { parseErrorHandler } from '../middleware/parseErrorHandler';

const PostPhotoEventSchema = APIGatewayProxyEventSchema.extend({
  body: createPostSchema,
});

type PostPhotoEventType = z.infer<typeof PostPhotoEventSchema>;

export const handler = middy()
  .use(httpEventNormalizerMiddleware())
  .use(httpHeaderNormalizerMiddleware())
  .use(httpJsonBodyParserMiddleware())
  .use(parser({ schema: PostPhotoEventSchema }))
  .use(
    httpCorsMiddleware({
      origin: '*',
      credentials: false,
    })
  )
  .use(
    httpResponseSerializerMiddleware({
      serializers: [
        {
          regex: /^application\/json$/,
          serializer: ({ body }) => JSON.stringify(body),
        },
      ],
      defaultContentType: 'application/json',
    })
  )
  .use(httpErrorHandler())
  .use(parseErrorHandler())
  .handler(async (event: PostPhotoEventType) => {
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
