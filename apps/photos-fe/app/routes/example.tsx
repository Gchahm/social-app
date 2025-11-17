import '@chahm/ui-components/styles/globals.css';
import { SidebarInset, SidebarProvider } from '@chahm/ui-components';
import { AppSidebar, Navbar, UploadImageForm } from '../components';

export function Example() {
  return (
    <SidebarProvider defaultOpen={true} className="h-full">
      <AppSidebar />
      <SidebarInset className="h-full">
        <Navbar />
        <div className="flex flex-col gap-4 p-4 overflow-auto">
          <UploadImageForm />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default Example;
