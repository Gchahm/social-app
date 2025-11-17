export interface User {
    userId: string;
    email: string;
    name: string;
    createdAt: string;
}

export interface Image {
    userId: string;
    imageId: string;
    // status: string; // e.g., "uploaded", "processed"
    originalS3Key: string;
    createdAt: string;
}

export interface DynamoDBItem {
    PK: string;
    SK: string;
    GSI1PK?: string;
    GSI1SK?: string;
    entityType: 'USER' | 'IMAGE';

    [key: string]: any;
}
