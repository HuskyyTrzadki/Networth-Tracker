"use client";

import { useRef, useState } from "react";
import { FileUp } from "lucide-react";

import { Button } from "@/features/design-system/components/ui/button";
import { cn } from "@/lib/cn";

import { ScreenshotPreviewTile } from "./ScreenshotPreviewTile";

const acceptPattern = "image/png,image/jpeg";

const isSupportedImage = (file: File) => {
  if (file.type) {
    return file.type === "image/png" || file.type === "image/jpeg";
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  return extension === "png" || extension === "jpg" || extension === "jpeg";
};

export function ScreenshotUploadDropzone({
  files,
  maxFiles,
  onFilesChange,
}: Readonly<{
  files: readonly File[];
  maxFiles: number;
  onFilesChange: (next: File[]) => void;
}>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const incomingList = Array.from(incoming);
    const filtered = incomingList.filter(isSupportedImage);

    if (files.length >= maxFiles) {
      setFeedbackMessage(`Osiągnięto limit ${maxFiles} plików.`);
      return;
    }

    if (filtered.length === 0) {
      setFeedbackMessage("Obsługiwane formaty to PNG oraz JPG.");
      return;
    }

    const next = [...files, ...filtered].slice(0, maxFiles);
    const skippedCount = incomingList.length - filtered.length;
    const limitedByMax = files.length + filtered.length > maxFiles;

    if (skippedCount > 0) {
      setFeedbackMessage("Niektóre pliki pominięto: obsługiwane są tylko PNG/JPG.");
    } else if (limitedByMax) {
      setFeedbackMessage(`Dodano maksymalnie ${maxFiles} plików.`);
    } else {
      setFeedbackMessage(null);
    }

    onFilesChange(next);
  };

  return (
    <div className="space-y-3">
      <div
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDragOver={(event) => {
          event.preventDefault();
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          "rounded-xl border border-dashed border-border/80 bg-muted/20 px-6 py-8 text-center transition",
          "duration-200 ease-[cubic-bezier(0.25,1,0.5,1)]",
          isDragging ? "border-primary/60 bg-primary/[0.08]" : "hover:bg-muted/30"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptPattern}
          multiple
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-border/70 bg-background">
          <FileUp className="size-5 text-muted-foreground" aria-hidden />
        </div>
        <p className="mt-3 text-sm font-medium text-foreground">
          Przeciągnij zrzuty ekranu lub wybierz pliki
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Maksymalnie {maxFiles} plików, formaty PNG/JPG
        </p>
        {feedbackMessage ? <p className="mt-2 text-xs font-medium text-destructive">{feedbackMessage}</p> : null}
        <Button
          type="button"
          variant="outline"
          className="mt-4 h-9 px-4"
          onClick={() => inputRef.current?.click()}
        >
          Dodaj pliki
        </Button>
      </div>

      {files.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {files.map((file, index) => (
            <ScreenshotPreviewTile
              key={`${file.name}-${file.lastModified}-${index}`}
              file={file}
              onRemove={() => {
                const next = files.filter((_, position) => position !== index);
                onFilesChange([...next]);
              }}
              className="h-32"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
