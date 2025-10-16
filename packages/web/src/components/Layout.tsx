import { Outlet } from 'react-router-dom';
import { AppSidebar } from './app-sidebar';
import { AppHeader } from './app-header';
import { SidebarProvider, SidebarInset } from './ui/sidebar';
import ErrorBoundary from './ui/error-boundary';
import ResponsiveContainer from './ui/responsive-container';

const Layout = () => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="overflow-hidden">
        <AppHeader />
        <ErrorBoundary>
          <ResponsiveContainer 
            maxWidth="full" 
            padding="md" 
            className="flex flex-1 flex-col"
          >
            <main className="w-full mx-auto max-w-7xl flex flex-1 flex-col gap-4 lg:gap-6 py-4 lg:py-6">
              <Outlet />
            </main>
          </ResponsiveContainer>
        </ErrorBoundary>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;
