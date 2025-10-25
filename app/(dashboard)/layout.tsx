import Sidebar from '@/components/layout/Sidebar';
import AlertsPanel from '@/components/layout/AlertsPanel';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Left Sidebar Navigation */}
        <Sidebar />

        {/* Main Content Area with 3-Column Grid */}
        <main className="flex-1 lg:ml-64">
          <div className="lg:grid lg:grid-cols-12 lg:gap-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Center Content (Main) */}
            <div className="lg:col-span-8 xl:col-span-9">
              {children}
            </div>

            {/* Right Alerts Panel */}
            <aside className="hidden lg:block lg:col-span-4 xl:col-span-3">
              <AlertsPanel />
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
