import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('./app.tsx'),
  route('about', './routes/about.tsx'),
  route('photos', './routes/photos.tsx'),
  route('upload', './routes/upload.tsx'),
] satisfies RouteConfig;
