import { type ItemDetail } from '@/lib/db/items';
import { itemTypeIcons } from '@/lib/icon-map';
import { formatRelativeTime } from '@/lib/format';
import { SheetHeader, SheetTitle } from '@/components/ui/sheet';

export function ItemDrawerHeader({ item, isEditing }: { item: ItemDetail; isEditing: boolean }) {
    return (
        <SheetHeader className="pt-6 pb-1">
            <div className="flex items-start gap-3 pr-6">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: `${item.itemType.color}26` }}>
                    {(() => {
                        const Icon = itemTypeIcons[item.itemType.icon];
                        return Icon ? <Icon className="size-5" style={{ color: item.itemType.color }} /> : null;
                    })()}
                </div>
                <div className="flex flex-col gap-1">
                    <SheetTitle className="text-lg">{item.title}</SheetTitle>
                    <span className="text-xs text-muted-foreground">Updated {formatRelativeTime(item.updatedAt)}</span>
                </div>
            </div>
        </SheetHeader>
    );
}
