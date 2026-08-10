"use client";

import { useSidebar } from "@/components/dashboard/sidebar-context";
import { SidebarContent } from "@/components/dashboard/SidebarContent";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

export function MobileSidebar() {
  const { mobileOpen, setMobileOpen } = useSidebar();

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent side="left" className="w-72 p-0">
        <div className="border-b border-sidebar-border px-4 py-4 font-semibold">
          <SheetTitle>Navigation</SheetTitle>
        </div>
        <SidebarContent />
      </SheetContent>
    </Sheet>
  );
}
