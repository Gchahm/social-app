'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@chahm/ui-components';
import { Bell, LogOut, Settings, User, Image, Upload } from 'lucide-react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { Link } from 'react-router';

// Fake user data
const fakeUser = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  initials: 'JD',
};

export function Navbar() {
  const { user, signOut } = useAuthenticator();

  const handleLogout = () => {
    signOut();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-4 px-4">
        {/* Logo/Brand */}
        <div className="flex items-center gap-2">
          <Image className="h-6 w-6" />
          <span className="font-semibold text-lg">Photos App</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex items-center gap-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Image className="h-4 w-4" />
            Photos
          </Link>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Upload className="h-4 w-4" />
            Upload
          </Link>
        </nav>

        <div className="flex flex-1 items-center justify-end gap-4">
          {/* Notifications */}
          <button
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 w-9"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </button>

          {/* User dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-md hover:bg-accent p-1 transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={fakeUser.avatar} alt={user.username} />
                  <AvatarFallback>{fakeUser.initials}</AvatarFallback>
                </Avatar>
                <div className="hidden md:flex md:flex-col md:items-start text-sm">
                  <span className="font-medium">{fakeUser.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {fakeUser.email}
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
