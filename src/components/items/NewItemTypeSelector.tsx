import { type ItemTypeWithCount } from "@/lib/db/items";
import { itemTypeIcons } from "@/lib/icon-map";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NewItemTypeSelectorProps {
  itemTypes: ItemTypeWithCount[];
  selectedType: string;
  onSelect: (value: string) => void;
}

export function NewItemTypeSelector({ itemTypes, selectedType, onSelect }: NewItemTypeSelectorProps) {
  const renderTypeValue = (value: string) => {
    const type = itemTypes.find((t) => t.value === value);
    if (!type) return value;
    const Icon = itemTypeIcons[type.icon];
    return (
      <>
        {Icon && <Icon className="size-4" style={{ color: type.color }} />}
        {type.name.replace(/s$/, "")}
      </>
    );
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="new-item-type">Type</Label>
      <Select value={selectedType} onValueChange={(value) => value && onSelect(value)}>
        <SelectTrigger id="new-item-type" className="w-full">
          <SelectValue>{(value: string) => renderTypeValue(value)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {itemTypes.map((type) => {
            const Icon = itemTypeIcons[type.icon];
            return (
              <SelectItem key={type.id} value={type.value}>
                {Icon && <Icon className="size-4" style={{ color: type.color }} />}
                {type.name.replace(/s$/, "")}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}