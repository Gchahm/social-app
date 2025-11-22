/**
 * Shared environment variables for SAM local testing
 * The generate-env.js script automatically discovers all Lambda functions
 * from the synthesized CloudFormation template and applies these shared variables
 *
 * Usage:
 *   1. Edit shared variables below
 *   2. Run: npx nx generate-env be
 *   3. Run: npx nx dev be
 */
module.exports = {
  // Shared environment variables applied to ALL Lambda functions
  shared: {
    TABLE_NAME: 'SocialMediaApp',
    BUCKET_NAME: 'bestack-storageconstructphotosbucket9c8e4cd0-fciy2djjzsku',
    CORS_ORIGINS: '*',
    SERVICE_NAME: 'app-dev',
  },

  // Optional: Lambda-specific overrides
  // If a specific Lambda needs different values, add them here
  overrides: {
    // Example:
    // "LambdaConstructPhotosLambdaC0248FB2": {
    //   CUSTOM_VAR: "custom-value"
    // }
  },
};
