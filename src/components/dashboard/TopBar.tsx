import { Layers, Search, Plus, FolderPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function TopBar() {
  return (
    <header className="grid w-full grid-cols-[1fr_minmax(0,28rem)_1fr] items-center gap-4 border-b px-6 py-4">
      <div className="flex items-center gap-2">
        <Layers className="size-5" />
        <span className="font-semibold">DevStash</span>
      </div>

      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search snippets, prompts, tags..."
          className="pl-9"
        />
      </div>

      <div className="flex items-center justify-self-end gap-2">
        <Button variant="secondary">
          <FolderPlus />
          New Collection
        </Button>
        <Button>
          <Plus />
          New item
        </Button>
      </div>
    </header>
  );
}
