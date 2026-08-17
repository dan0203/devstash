"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Layers, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function updateNavbar() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", updateNavbar, { passive: true });
    updateNavbar();
    return () => window.removeEventListener("scroll", updateNavbar);
  }, []);

  return (
    <nav
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b border-transparent backdrop-blur-md transition-colors duration-300",
        scrolled ? "border-border bg-background/90" : "bg-background/35"
      )}
    >
      <div className="mx-auto flex max-w-[1160px] items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <Layers className="size-5 text-blue-500" />
          DevStash
        </Link>

        <div className="hidden gap-7 text-sm text-muted-foreground sm:flex">
          <Link href="/#features" className="hover:text-foreground">
            Features
          </Link>
          <Link href="/#pricing" className="hover:text-foreground">
            Pricing
          </Link>
        </div>

        <div className="flex items-center gap-2.5">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" aria-label="Open menu" className="sm:hidden" />}
            >
              <Menu className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem render={<Link href="/#features" />}>Features</DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/#pricing" />}>Pricing</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" nativeButton={false} render={<Link href="/sign-in" />}>
            Sign In
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/register" />}
            className="bg-gradient-to-br from-sky-400 to-blue-600 text-white hover:brightness-110"
          >
            Get Started
          </Button>
        </div>
      </div>
    </nav>
  );
}
