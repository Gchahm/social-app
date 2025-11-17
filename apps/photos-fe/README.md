# photos-fe: configuring VITE_POST_URL

The Photos frontend reads the upload endpoint from the Vite env variable `VITE_POST_URL`.
This is required by the UploadImageForm component to POST base64 images to the backend.

How to set it
- Local development (SAM local)
  1. In a terminal, from `apps/be`, run: `nx run be:dev` (or run the equivalent SAM command).
  2. The local API will listen on `http://127.0.0.1:3000`. The upload route is `/spaces`.
  3. In `apps/photos-fe`, create a file named `.env.local` and add:

     VITE_POST_URL=http://127.0.0.1:3000/spaces

  4. Restart your frontend dev server if it was running.

- Deployed API Gateway
  1. Deploy the backend: `nx run be:deploy`.
  2. After deployment, find the API Gateway invoke URL (e.g. in AWS Console or from your CDK outputs).
  3. Set `VITE_POST_URL` to `<api-base-url>/spaces`, for example:

     VITE_POST_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod/spaces

Where to put env files
- Use `.env` for shared defaults, and `.env.local` for machine-specific values. Vite automatically loads these files.
- Any variable that should be exposed to the browser must be prefixed with `VITE_`.

Quick start
1. Copy `.env.example` to `.env.local`.
2. Fill in `VITE_POST_URL` with your local or deployed URL.
3. Start the FE dev server for the photos app (e.g., via your workspace command) and open the Example route that renders `UploadImageForm`.
