import '@chahm/ui-components/styles/globals.css';
import { SidebarInset, SidebarProvider } from '@chahm/ui-components';
import { AppSidebar, Navbar } from '../components';

export function App() {
  return (
    <SidebarProvider defaultOpen={true} className="h-full">
      <AppSidebar />
      <SidebarInset className="h-full">
        <Navbar />
        <div className="flex flex-col gap-4 p-4 overflow-auto">nothing</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default App;
