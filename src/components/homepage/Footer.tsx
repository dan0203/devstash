import Link from "next/link";
import { Layers } from "lucide-react";
import { FOOTER_COLUMNS } from "@/lib/homepage-data";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border pt-15">
      <div className="mx-auto grid max-w-[1160px] grid-cols-1 gap-8 px-6 pb-12 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-2 font-bold">
            <Layers className="size-5 text-blue-500" />
            DevStash
          </Link>
          <p className="mt-3 max-w-65 text-sm text-muted-foreground">
            A developer knowledge hub for everything you&apos;d otherwise lose.
          </p>
        </div>

        {FOOTER_COLUMNS.map((column) => (
          <div key={column.title}>
            <h4 className="mb-3.5 text-xs font-semibold tracking-wide text-muted-foreground/70 uppercase">
              {column.title}
            </h4>
            {column.links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="mb-2.5 block text-sm text-muted-foreground hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </div>
        ))}
      </div>

      <div className="border-t border-border px-6 py-5 text-center text-sm text-muted-foreground/70">
        © {year} DevStash. All rights reserved.
      </div>
    </footer>
  );
}
