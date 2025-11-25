import { layout, route, type RouteConfig, index } from '@react-router/dev/routes';

export default [
  // Public routes (no authentication required)
  layout('./layout.tsx', [
    index('./routes/_index.tsx'),
    route('users/:username', './routes/users.$username.tsx'),
    route('*', './routes/$.tsx'),
  ]),

  // Authenticated routes (authentication required)
  layout('./auth-layout.tsx', [
    route('my/feed', './routes/my.feed.tsx'),
    route('my/upload', './routes/my.upload.tsx'),
  ]),
] satisfies RouteConfig;
