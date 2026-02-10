"use client";

import { Badge } from "@saltwise/ui/components/badge";
import { Progress } from "@saltwise/ui/components/progress";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  FileTextIcon,
  ImageIcon,
  UploadCloudIcon,
  XIcon,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type { PrescriptionMedicine } from "@/lib/types";

type UploadStatus = "idle" | "reading" | "parsing" | "done" | "error";

interface PrescriptionUploadProps {
  onMedicinesIdentified: (medicines: PrescriptionMedicine[]) => void;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB

function getStatusLabel(status: UploadStatus): string {
  switch (status) {
    case "reading":
      return "Reading image...";
    case "parsing":
      return "Identifying medicines via AI...";
    case "done":
      return "Medicines identified!";
    case "error":
      return "Failed to process prescription";
    default:
      return "";
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StatusIcon({
  status,
  isDragOver,
  isProcessing,
}: {
  status: UploadStatus;
  isDragOver: boolean;
  isProcessing: boolean;
}) {
  if (status === "done") {
    return (
      <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
        <CheckCircle2Icon className="size-6 text-emerald-600 dark:text-emerald-400" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10">
        <AlertCircleIcon className="size-6 text-destructive" />
      </div>
    );
  }

  return (
    <div
      className={`flex size-12 items-center justify-center rounded-xl transition-colors duration-300 ${
        isDragOver ? "bg-primary/10" : "bg-muted/40 dark:bg-white/[0.06]"
      }`}
    >
      {isProcessing ? (
        <ImageIcon className="size-6 animate-pulse text-primary" />
      ) : (
        <UploadCloudIcon
          className={`size-6 transition-colors duration-300 ${
            isDragOver ? "text-primary" : "text-muted-foreground/50"
          }`}
        />
      )}
    </div>
  );
}

export function PrescriptionUpload({
  onMedicinesIdentified,
}: PrescriptionUploadProps) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [medicineCount, setMedicineCount] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      setFileName(file.name);
      setErrorMessage(null);
      setMedicineCount(0);

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setStatus("error");
        setErrorMessage(
          `File too large (${formatFileSize(file.size)}). Maximum is 4 MB.`
        );
        return;
      }

      // --- Phase 1: Read file as base64 ---
      setStatus("reading");
      setProgress(15);

      let dataUri: string;
      try {
        dataUri = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(file);
        });
      } catch {
        setStatus("error");
        setErrorMessage("Could not read the image file.");
        setProgress(0);
        return;
      }

      setProgress(30);

      // --- Phase 2: Send to OCR API ---
      setStatus("parsing");
      setProgress(45);

      // Gradually animate progress while waiting for API
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) {
            clearInterval(progressInterval);
            return 85;
          }
          return prev + 2;
        });
      }, 300);

      try {
        const res = await fetch("/api/prescription/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: dataUri }),
        });

        clearInterval(progressInterval);

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const message =
            (data as { error?: string }).error ??
            "Failed to process prescription";

          // Special handling for auth errors
          if (res.status === 401) {
            setStatus("error");
            setErrorMessage("Please sign in to upload prescriptions.");
            setProgress(0);
            return;
          }

          throw new Error(message);
        }

        const data: { medicines: PrescriptionMedicine[]; confidence: number } =
          await res.json();

        if (data.medicines.length === 0) {
          setStatus("error");
          setErrorMessage(
            "No medicines detected. Try a clearer photo of the prescription."
          );
          setProgress(0);
          return;
        }

        setProgress(100);
        setStatus("done");
        setMedicineCount(data.medicines.length);
        onMedicinesIdentified(data.medicines);
      } catch (err) {
        clearInterval(progressInterval);
        setStatus("error");
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to process prescription"
        );
        setProgress(0);
      }
    },
    [onMedicinesIdentified]
  );

  const handleFile = useCallback(
    (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setStatus("error");
        setFileName(file.name);
        setErrorMessage("Unsupported format. Use JPEG, PNG, or WebP images.");
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
    setErrorMessage(null);
    setMedicineCount(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const isProcessing = status === "reading" || status === "parsing";

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
            <StatusIcon
              isDragOver={isDragOver}
              isProcessing={isProcessing}
              status={status}
            />
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            {status === "idle" && (
              <div>
                <p className="font-heading font-medium text-foreground text-sm">
                  Upload Prescription
                </p>
                <p className="mt-0.5 text-muted-foreground text-xs">
                  Drop a photo or{" "}
                  <button
                    className="font-medium text-primary underline-offset-2 hover:underline"
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                  >
                    browse
                  </button>{" "}
                  &middot; JPEG, PNG, WebP &middot; max 4 MB
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
                  {medicineCount}{" "}
                  {medicineCount === 1 ? "medicine" : "medicines"} found
                </Badge>
              </div>
            )}

            {status === "error" && (
              <div>
                <p className="font-medium text-destructive text-xs">
                  {errorMessage ?? getStatusLabel(status)}
                </p>
                <p className="mt-0.5 text-muted-foreground text-xs">
                  Accepted: JPEG, PNG, WebP images up to 4 MB
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
