import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PhotosContext } from './context';
import { getPhotos } from './get';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { S3 } from '@aws-sdk/client-s3';
import type { APIGatewayProxyEvent } from 'aws-lambda';

// Mock the S3 presigner
vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://test-bucket.s3.amazonaws.com/signed-url'),
}));

describe('getPhotos', () => {
  const mockContext: PhotosContext = {
    db: {} as DynamoDB,
    s3: {} as S3,
    tableName: 'test-table',
    bucketName: 'test-bucket',
  };

  it('should return all images for the current user', async () => {
    // Create mock query response
    const mockQuery = vi.fn().mockResolvedValue({
      Items: [
        {
          PK: { S: 'USER#user-123' },
          SK: { S: 'IMAGE#img-1' },
          GSI1PK: { S: 'IMAGE#img-1' },
          entityType: { S: 'IMAGE' },
          userId: { S: 'user-123' },
          imageId: { S: 'img-1' },
          originalS3Key: { S: 'photos/img-1' },
          createdAt: { S: '2024-01-01T00:00:00.000Z' },
        },
        {
          PK: { S: 'USER#user-123' },
          SK: { S: 'IMAGE#img-2' },
          GSI1PK: { S: 'IMAGE#img-2' },
          entityType: { S: 'IMAGE' },
          userId: { S: 'user-123' },
          imageId: { S: 'img-2' },
          originalS3Key: { S: 'photos/img-2' },
          createdAt: { S: '2024-01-02T00:00:00.000Z' },
        },
      ],
    });

    const ctx: PhotosContext = {
      ...mockContext,
      db: { query: mockQuery } as unknown as DynamoDB,
    };

    // Mock event with user ID
    const mockEvent = {
      requestContext: {
        authorizer: {
          claims: {
            sub: 'user-123',
          },
        },
      },
    } as unknown as APIGatewayProxyEvent;

    // Execute function
    const response = await getPhotos(mockEvent, ctx);

    // Assertions
    expect(response.statusCode).toBe(200);
    expect(mockQuery).toHaveBeenCalledWith({
      TableName: 'test-table',
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': { S: 'USER#user-123' },
        ':sk': { S: 'IMAGE#' },
      },
    });

    const body = JSON.parse(response.body);
    expect(body.count).toBe(2);
    expect(body.images).toHaveLength(2);
    expect(body.images[0]).toEqual({
      userId: 'user-123',
      imageId: 'img-1',
      originalS3Key: 'photos/img-1',
      createdAt: '2024-01-01T00:00:00.000Z',
      url: 'https://test-bucket.s3.amazonaws.com/signed-url',
    });
  });

  it('should return empty array when user has no images', async () => {
    const mockQuery = vi.fn().mockResolvedValue({
      Items: [],
    });

    const ctx: PhotosContext = {
      ...mockContext,
      db: { query: mockQuery } as unknown as DynamoDB,
    };

    const mockEvent = {
      requestContext: {
        authorizer: {
          claims: {
            sub: 'user-123',
          },
        },
      },
    } as unknown as APIGatewayProxyEvent;

    const response = await getPhotos(mockEvent, ctx);

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.count).toBe(0);
    expect(body.images).toEqual([]);
  });

  it('should return 401 when user ID is not found', async () => {
    const ctx: PhotosContext = mockContext;

    // Mock event without user ID
    const mockEvent = {
      requestContext: {
        authorizer: {
          claims: {},
        },
      },
    } as unknown as APIGatewayProxyEvent;

    const response = await getPhotos(mockEvent, ctx);

    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.message).toContain('Unauthorized');
  });

  it('should return 500 on DynamoDB error', async () => {
    const mockQuery = vi
      .fn()
      .mockRejectedValue(new Error('DynamoDB error'));

    const ctx: PhotosContext = {
      ...mockContext,
      db: { query: mockQuery } as unknown as DynamoDB,
    };

    const mockEvent = {
      requestContext: {
        authorizer: {
          claims: {
            sub: 'user-123',
          },
        },
      },
    } as unknown as APIGatewayProxyEvent;

    const response = await getPhotos(mockEvent, ctx);

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.message).toContain('Error fetching images');
  });

  it('should filter out invalid DynamoDB items', async () => {
    const mockQuery = vi.fn().mockResolvedValue({
      Items: [
        {
          PK: { S: 'USER#user-123' },
          SK: { S: 'IMAGE#img-1' },
          GSI1PK: { S: 'IMAGE#img-1' },
          entityType: { S: 'IMAGE' },
          userId: { S: 'user-123' },
          imageId: { S: 'img-1' },
          originalS3Key: { S: 'photos/img-1' },
          createdAt: { S: '2024-01-01T00:00:00.000Z' },
        },
        // Invalid item (missing required fields)
        {
          PK: { S: 'USER#user-123' },
          SK: { S: 'IMAGE#img-2' },
        },
      ],
    });

    const ctx: PhotosContext = {
      ...mockContext,
      db: { query: mockQuery } as unknown as DynamoDB,
    };

    const mockEvent = {
      requestContext: {
        authorizer: {
          claims: {
            sub: 'user-123',
          },
        },
      },
    } as unknown as APIGatewayProxyEvent;

    const response = await getPhotos(mockEvent, ctx);

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    // Should only return the valid item
    expect(body.count).toBe(1);
    expect(body.images).toHaveLength(1);
  });
});
