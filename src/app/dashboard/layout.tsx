import { TopBar } from "@/components/dashboard/TopBar";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { SidebarProvider } from "@/components/dashboard/sidebar-context";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <SidebarProvider>
      <div className="flex h-dvh flex-col">
        <TopBar />
        <div className="flex min-h-0 flex-1">
          <Sidebar />
          <MobileSidebar />
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}
