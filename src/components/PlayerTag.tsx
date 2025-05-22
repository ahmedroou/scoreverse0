
"use client";
import { Badge } from "@/components/ui/badge";
import { XIcon, User } from "lucide-react";

interface PlayerTagProps {
  name: string;
  onRemove?: () => void;
  isWinner?: boolean;
}

export function PlayerTag({ name, onRemove, isWinner }: PlayerTagProps) {
  return (
    <Badge
      variant={isWinner ? "default" : "secondary"}
      className={`flex items-center gap-1.5 py-1 px-2.5 text-sm transition-all duration-150 ease-in-out
                  ${isWinner ? 'bg-primary text-primary-foreground shadow-md' : 'bg-accent text-accent-foreground'}`}
    >
      <User className="h-3.5 w-3.5" />
      <span>{name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 rounded-full hover:bg-destructive/20 p-0.5 transition-colors"
          aria-label={`Remove ${name}`}
        >
          <XIcon className="h-3.5 w-3.5" />
        </button>
      )}
    </Badge>
  );
}
