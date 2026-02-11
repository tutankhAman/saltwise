"use client";

import { RefreshCwIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface SearchProgressUIProps {
  query: string;
  jobId: string | undefined;
  isActive: boolean;
  onComplete?: () => void;
}

interface JobStatus {
  status: "pending" | "processing" | "completed" | "failed";
  resultCount?: number;
  error?: string;
  currentStep?: string;
  pharmaciesScraped?: number;
  totalPharmacies?: number;
}

export function SearchProgressUI({
  jobId,
  isActive,
  onComplete,
}: SearchProgressUIProps) {
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);

  useEffect(() => {
    if (!(isActive && jobId)) {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (res.ok) {
          const data: JobStatus = await res.json();
          setJobStatus(data);

          if (data.status === "completed") {
            onComplete?.();
          } else if (data.status === "failed") {
            // Could handle failure here
          }
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    }, 1500);

    return () => clearInterval(pollInterval);
  }, [isActive, jobId, onComplete]);

  if (!isActive) {
    return null;
  }

  const getProgressText = () => {
    if (!jobStatus) {
      return "Initializing search...";
    }

    switch (jobStatus.status) {
      case "processing":
        return jobStatus.currentStep === "scrape"
          ? `Scraping pharmacies... (${jobStatus.pharmaciesScraped || 0} found)`
          : "Searching for medicines...";
      case "completed":
        return `Found ${jobStatus.resultCount || 0} medicines`;
      case "failed":
        return `Search failed: ${jobStatus.error || "Unknown error"}`;
      default:
        return "Preparing search...";
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground text-sm">
      <RefreshCwIcon className="size-4 animate-spin" />
      <span>{getProgressText()}</span>
    </div>
  );
}
