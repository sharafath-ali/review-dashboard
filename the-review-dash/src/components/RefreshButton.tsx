"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface Props {
  onRefreshed: () => void;
}

export default function RefreshButton({ onRefreshed }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [summary, setSummary] = useState<string | null>(null);

  async function handleRefresh() {
    setStatus("loading");
    setSummary(null);
    try {
      const res = await fetch("/api/ingest", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? data.error ?? "Unknown error");
      const s = data.summary;
      setSummary(
        `Fetched ${s.totalFetched} · ${s.totalInserted} new · ${s.totalSkipped} duplicate${
          s.totalErrors > 0 ? ` · ${s.totalErrors} error(s)` : ""
        }`
      );
      setStatus("done");
      onRefreshed();
    } catch (err) {
      setSummary(err instanceof Error ? err.message : "Ingestion failed");
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        id="refresh-btn"
        onClick={handleRefresh}
        disabled={status === "loading"}
        variant={status === "error" ? "destructive" : "default"}
        size="sm"
        className="gap-2"
      >
        <RefreshCw
          className={`w-3.5 h-3.5 ${status === "loading" ? "animate-spin" : ""}`}
        />
        {status === "loading" ? "Fetching…" : "Fetch Reviews"}
      </Button>
      {summary && (
        <p className={`text-xs ${status === "error" ? "text-red-600" : "text-slate-500"}`}>
          {summary}
        </p>
      )}
    </div>
  );
}
