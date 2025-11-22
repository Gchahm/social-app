import { Outlet } from 'react-router';
import { Image } from 'lucide-react';

export default function PublicLayout() {
  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-4 px-4">
          <div className="flex items-center gap-2">
            <Image className="h-6 w-6" />
            <span className="font-semibold text-lg">Photos App</span>
          </div>
        </div>
      </header>
      <div className="flex justify-center">
        <div className="max-w-2xl">
          <Outlet />
        </div>
      </div>
    </>
  );
}
