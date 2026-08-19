import { type ItemTypeWithCount } from "@/lib/db/items";
import { itemTypeIcons } from "@/lib/icon-map";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface NewItemTypeSelectorProps {
  itemTypes: ItemTypeWithCount[];
  selectedType: string;
  onSelect: (value: string) => void;
}

export function NewItemTypeSelector({ itemTypes, selectedType, onSelect }: NewItemTypeSelectorProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>Type</Label>
      <div className="flex flex-wrap gap-2">
        {itemTypes.map((type) => {
          const Icon = itemTypeIcons[type.icon];
          const active = type.value === selectedType;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onSelect(type.value)}
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm",
                active ? "border-primary bg-primary/10" : "border-border hover:bg-accent"
              )}
            >
              {Icon && <Icon className="size-4" style={{ color: type.color }} />}
              {type.name.replace(/s$/, "")}
            </button>
          );
        })}
      </div>
    </div>
  );
}