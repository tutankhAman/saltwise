"use client";

import { Badge } from "@saltwise/ui/components/badge";
import { Progress } from "@saltwise/ui/components/progress";
import {
  CheckCircle2Icon,
  FileTextIcon,
  UploadCloudIcon,
  XIcon,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { parseMockPrescription } from "@/lib/mock-data";
import type { DrugSearchResult } from "@/lib/types";

type UploadStatus = "idle" | "uploading" | "parsing" | "done" | "error";

interface PrescriptionUploadProps {
  onResults: (results: DrugSearchResult[], fileName: string) => void;
}

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

function getStatusLabel(status: UploadStatus): string {
  switch (status) {
    case "uploading":
      return "Uploading prescription...";
    case "parsing":
      return "Reading medicines from prescription...";
    case "done":
      return "Prescription parsed successfully!";
    case "error":
      return "Failed to parse prescription. Please try again.";
    default:
      return "";
  }
}

export function PrescriptionUpload({ onResults }: PrescriptionUploadProps) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      setFileName(file.name);
      setStatus("uploading");
      setProgress(0);

      // Simulate upload progress
      const uploadInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 40) {
            clearInterval(uploadInterval);
            return 40;
          }
          return prev + 8;
        });
      }, 100);

      // Wait for "upload" to reach 40%
      await new Promise((resolve) => setTimeout(resolve, 600));
      clearInterval(uploadInterval);
      setProgress(40);

      // Switch to parsing phase
      setStatus("parsing");
      const parseInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(parseInterval);
            return 90;
          }
          return prev + 5;
        });
      }, 150);

      try {
        const result = await parseMockPrescription(file.name);
        clearInterval(parseInterval);
        setProgress(100);
        setStatus("done");
        onResults(result.results, result.fileName);
      } catch {
        clearInterval(parseInterval);
        setStatus("error");
        setProgress(0);
      }
    },
    [onResults]
  );

  const handleFile = useCallback(
    (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setStatus("error");
        setFileName(file.name);
        return;
      }
      processFile(file);
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setProgress(0);
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const isProcessing = status === "uploading" || status === "parsing";

  const dropZoneClasses = (() => {
    const base =
      "relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300";
    if (isDragOver) {
      return `${base} border-primary bg-primary/5 shadow-lg shadow-primary/10`;
    }
    if (status === "done") {
      return `${base} border-emerald-300 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-950/20`;
    }
    if (status === "error") {
      return `${base} border-destructive/40 bg-destructive/5`;
    }
    return `${base} border-border/50 bg-white/40 backdrop-blur-xl hover:border-primary/30 hover:bg-white/60 dark:bg-white/[0.03] dark:hover:bg-white/[0.05]`;
  })();

  return (
    <div className="fade-in slide-in-from-bottom-2 animate-in fill-mode-forwards delay-200 duration-700 ease-out">
      {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: drop zone requires drag events on the label wrapper */}
      <label
        className={dropZoneClasses}
        htmlFor="prescription-file-input"
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Top accent */}
        <div className="absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

        <div className="flex flex-col items-center gap-3 px-6 py-6 text-center sm:flex-row sm:text-left">
          {/* Icon */}
          <div className="flex shrink-0 items-center justify-center">
            {status === "done" ? (
              <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2Icon className="size-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            ) : (
              <div
                className={`flex size-12 items-center justify-center rounded-xl transition-colors duration-300 ${
                  isDragOver
                    ? "bg-primary/10"
                    : "bg-muted/40 dark:bg-white/[0.06]"
                }`}
              >
                <UploadCloudIcon
                  className={`size-6 transition-colors duration-300 ${
                    isDragOver ? "text-primary" : "text-muted-foreground/50"
                  }`}
                />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            {status === "idle" && (
              <div>
                <p className="font-heading font-medium text-foreground text-sm">
                  Upload Prescription
                </p>
                <p className="mt-0.5 text-muted-foreground text-xs">
                  Drag & drop an image or PDF, or{" "}
                  <button
                    className="font-medium text-primary underline-offset-2 hover:underline"
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                  >
                    browse files
                  </button>
                </p>
              </div>
            )}

            {isProcessing && (
              <div className="w-full space-y-2">
                <div className="flex items-center gap-2">
                  <FileTextIcon className="size-3.5 text-primary" />
                  <span className="truncate font-medium text-foreground text-xs">
                    {fileName}
                  </span>
                  <Badge className="shrink-0 border-0 bg-primary/10 text-[0.6rem] text-primary">
                    {getStatusLabel(status)}
                  </Badge>
                </div>
                <Progress value={progress}>
                  <span className="sr-only">{progress}% complete</span>
                </Progress>
              </div>
            )}

            {status === "done" && (
              <div className="flex items-center gap-2">
                <FileTextIcon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="truncate font-medium text-emerald-700 text-xs dark:text-emerald-300">
                  {fileName}
                </span>
                <Badge className="shrink-0 border-0 bg-emerald-100 text-[0.6rem] text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  {getStatusLabel(status)}
                </Badge>
              </div>
            )}

            {status === "error" && (
              <div>
                <p className="font-medium text-destructive text-xs">
                  {getStatusLabel(status)}
                </p>
                <p className="mt-0.5 text-muted-foreground text-xs">
                  Accepted formats: JPEG, PNG, WebP, PDF
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2">
            {status === "idle" && (
              <button
                className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 font-heading font-medium text-primary text-xs shadow-sm transition-all duration-200 hover:bg-primary/10 hover:shadow-md active:scale-95"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                <UploadCloudIcon className="size-3.5" />
                Upload
              </button>
            )}
            {(status === "done" || status === "error") && (
              <button
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={reset}
                type="button"
              >
                <XIcon className="size-4" />
              </button>
            )}
          </div>
        </div>
      </label>

      <input
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        id="prescription-file-input"
        onChange={handleInputChange}
        ref={fileInputRef}
        type="file"
      />
    </div>
  );
}
