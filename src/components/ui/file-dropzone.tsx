"use client";

import { Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  accept?: string;
  maxFiles?: number;
  maxSizeMb?: number;
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  label?: string;
  hint?: string;
}

export function FileDropzone({
  accept = "application/pdf",
  maxFiles = 20,
  maxSizeMb = 5,
  onFilesSelected,
  disabled = false,
  label = "Drop PDF files here",
  hint,
}: FileDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (rawFiles: FileList | null) => {
      if (!rawFiles) return;
      const valid = Array.from(rawFiles)
        .slice(0, maxFiles)
        .filter((f) => f.size <= maxSizeMb * 1024 * 1024);
      if (valid.length) onFilesSelected(valid);
    },
    [maxFiles, maxSizeMb, onFilesSelected],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (!disabled) handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!disabled) inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={cn(
        "group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-all duration-150",
        dragging
          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20"
          : "border-zinc-300 hover:border-indigo-400 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:border-indigo-600 dark:hover:bg-zinc-900/50",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl transition-colors",
          dragging
            ? "bg-indigo-100 dark:bg-indigo-900/40"
            : "bg-zinc-100 group-hover:bg-indigo-100 dark:bg-zinc-800 dark:group-hover:bg-indigo-900/40",
        )}
      >
        <Upload
          size={22}
          className={cn("transition-colors", dragging ? "text-indigo-600" : "text-zinc-400 group-hover:text-indigo-500")}
        />
      </div>
      <div>
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</p>
        <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
          {hint ?? `Up to ${maxFiles} files · PDF only · Max ${maxSizeMb}MB each`}
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={maxFiles > 1}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled}
      />
    </div>
  );
}
