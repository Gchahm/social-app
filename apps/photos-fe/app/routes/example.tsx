import '@chahm/ui-components/styles/globals.css';
import { SidebarInset, SidebarProvider } from '@chahm/ui-components';
import { AppSidebar, Navbar, LoginForm, RegisterForm } from '../components';
import { useState } from 'react';

export function Example() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  return (
    <SidebarProvider defaultOpen={true} className="h-full">
      <AppSidebar />
      <SidebarInset className="h-full">
        <Navbar />
        <div className="flex flex-col gap-4 p-4 overflow-auto">
          <div style={{ maxWidth: '400px', margin: '0 auto', width: '100%' }}>
            <div
              style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '20px',
                borderBottom: '2px solid #e0e0e0',
              }}
            >
              <button
                onClick={() => setActiveTab('login')}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: activeTab === 'login' ? 'bold' : 'normal',
                  borderBottom:
                    activeTab === 'login' ? '3px solid #007bff' : 'none',
                  marginBottom: '-2px',
                  color: activeTab === 'login' ? '#007bff' : '#666',
                }}
              >
                Login
              </button>
              <button
                onClick={() => setActiveTab('register')}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: activeTab === 'register' ? 'bold' : 'normal',
                  borderBottom:
                    activeTab === 'register' ? '3px solid #28a745' : 'none',
                  marginBottom: '-2px',
                  color: activeTab === 'register' ? '#28a745' : '#666',
                }}
              >
                Register
              </button>
            </div>

            {activeTab === 'login' ? <LoginForm /> : <RegisterForm />}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default Example;
