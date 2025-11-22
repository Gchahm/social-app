import { Authenticator } from '@aws-amplify/ui-react';
import { Navbar } from './components';
import { Outlet } from 'react-router';

export default function AuthLayout() {
  return (
    <Authenticator>
      <Navbar />
      <div className="flex justify-center">
        <div className="max-w-2xl">
          <Outlet />
        </div>
      </div>
    </Authenticator>
  );
}
