import { Navbar } from './components';
import { Outlet } from 'react-router';

export default function RootLayout() {
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
