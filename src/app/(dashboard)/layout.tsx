import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { SidebarProvider } from "@/lib/sidebar-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-[100dvh] bg-ink text-ink-50">
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0 min-h-[100dvh]">
          <Topbar />
          <main className="flex-1 overflow-y-auto" id="main-content">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
