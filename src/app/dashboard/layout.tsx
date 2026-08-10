import { TopBar } from "@/components/dashboard/TopBar";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <div className="flex min-h-full flex-col">
      <TopBar />
      <div className="flex flex-1">{children}</div>
    </div>
  );
}
