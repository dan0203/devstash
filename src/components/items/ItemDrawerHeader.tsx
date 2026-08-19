import { type ItemDetail } from "@/lib/db/items";
import { itemTypeIcons } from "@/lib/icon-map";
import { formatRelativeTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";

export function ItemDrawerHeader({ item, isEditing }: { item: ItemDetail; isEditing: boolean }) {
  return (
    <SheetHeader className="pt-6">
      <div className="mb-3 flex items-start justify-between gap-2 pr-6">
        <div className="flex items-center gap-3">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-md"
            style={{ backgroundColor: `${item.itemType.color}26` }}
          >
            {(() => {
              const Icon = itemTypeIcons[item.itemType.icon];
              return Icon ? <Icon className="size-5" style={{ color: item.itemType.color }} /> : null;
            })()}
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="text-[10px] uppercase tracking-wide"
                style={{ color: item.itemType.color }}
              >
                {item.itemType.name}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Updated {formatRelativeTime(item.updatedAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
      <SheetTitle className="text-lg">{isEditing ? "Edit Item" : item.title}</SheetTitle>
    </SheetHeader>
  );
}