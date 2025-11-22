import { Outlet } from 'react-router';
import { Navbar } from './components';

export default function PublicLayout() {
  return (
    <>
      <Navbar />
      <div className="flex justify-center">
        <div className="max-w-2xl">
          <Outlet />
        </div>
      </div>
    </>
  );
}
