/**
 * Photos API Handlers
 *
 * Lambda functions for managing photo uploads using presigned URLs
 */

// Presigned URL upload flow (Recommended)
export { handler as requestUploadUrl } from './request-upload-url';
export { handler as confirmUpload } from './confirm-upload';

// Legacy handlers (direct upload through Lambda)
export { getHandler as getPhotos } from './get';
export { postHandler as uploadPhoto } from './post';

// Utilities
export * from './utils';
