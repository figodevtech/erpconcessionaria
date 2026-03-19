"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TagInputProps {
  value?: string[];
  onChange?: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function TagInput({
  value = [],
  onChange,
  placeholder = "Digite e pressione Enter...",
  className,
  disabled = false,
}: TagInputProps) {
  const [inputValue, setInputValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const tags = Array.isArray(value) ? value : [];

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      const newTags = [...tags, trimmedTag];
      onChange?.(newTags);
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove);
    onChange?.(newTags);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace to delete last tag when input is empty
    if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }

    // Also handle Enter to add tag
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (trimmed) {
        addTag(trimmed);
        setInputValue("");
      }
    }
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const pastedTags = pastedText.split(/[\s,]+/).filter((tag) => tag.trim() !== "");

    if (pastedTags.length > 0) {
      const newTags = [...tags];
      for (const tag of pastedTags) {
        const trimmedTag = tag.trim();
        if (trimmedTag && !newTags.includes(trimmedTag)) {
          newTags.push(trimmedTag);
        }
      }
      onChange?.(newTags);
      setInputValue("");
    }
  };

  return (
    <div
      onClick={handleContainerClick}
      className={cn(
        "flex min-h-12 w-full flex-wrap items-center gap-2 rounded-xl border border-primary/10 bg-background/50 px-3 py-2 text-sm ring-offset-background transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {tags.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className="gap-1.5 px-2 py-1 bg-primary/10 text-primary hover:bg-primary/20 border-primary/10 transition-colors group/tag"
        >
          <span className="text-xs font-semibold">{tag}</span>
          {!disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20 focus:outline-none hover:cursor-pointer transition-colors"
              aria-label={`Remover tag ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </Badge>
      ))}
      <input
        ref={inputRef}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        disabled={disabled}
        placeholder={tags.length === 0 ? placeholder : ""}
        className="flex-1 bg-transparent border-none outline-none placeholder:text-muted-foreground/50 min-w-[150px] text-lg py-1"
      />
    </div>
  );
}
