import Sidebar from '@/components/layout/Sidebar';
import AlertsPanel from '@/components/layout/AlertsPanel';
import { ToastProvider } from '@/components/ui/ToastContainer';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-white flex">
        {/* Left Sidebar Navigation */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-8">
            <div className="lg:grid lg:grid-cols-12 lg:gap-6">
              {/* Center Content (Main) */}
              <div className="lg:col-span-8 xl:col-span-9">
                {children}
              </div>

              {/* Right Alerts Panel */}
              <aside className="hidden lg:block lg:col-span-4 xl:col-span-3">
                <AlertsPanel />
              </aside>
            </div>
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
