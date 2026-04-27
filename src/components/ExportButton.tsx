"use client";

import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, FileSpreadsheet, File } from "lucide-react";
import { Entry, ExportRange } from "@/types";
import { exportAsCSV, exportAsPDF, exportAsExcel } from "@/lib/exports";
import { toast } from "sonner";

interface ExportButtonProps {
  entries: Entry[];
  userName: string;
}

export default function ExportButton({ entries, userName }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (
    type: "csv" | "pdf" | "excel",
    range: ExportRange
  ) => {
    setExporting(true);
    try {
      switch (type) {
        case "csv":
          exportAsCSV(entries, range);
          break;
        case "pdf":
          await exportAsPDF(entries, range, userName);
          break;
        case "excel":
          await exportAsExcel(entries, range);
          break;
      }
      toast.success(
        `Exported ${type.toUpperCase()} — ${range === "last30" ? "Last 30 Days" : range === "thisMonth" ? "This Month" : "All Time"}`
      );
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const rangeOptions: { label: string; value: ExportRange }[] = [
    { label: "Last 30 Days", value: "last30" },
    { label: "This Month", value: "thisMonth" },
    { label: "All Time", value: "allTime" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={exporting || entries.length === 0}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5 text-sm font-medium text-foreground tracking-wide transition-all hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
      >
        <Download className="h-4 w-4" />
        Export
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64 bg-card border-border text-foreground p-2"
      >
        {/* CSV */}
        <div className="px-2 py-1.5 mb-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest">
            <FileText className="h-3 w-3" />
            CSV
          </div>
        </div>
        {rangeOptions.map((r) => (
          <DropdownMenuItem
            key={`csv-${r.value}`}
            onClick={() => handleExport("csv", r.value)}
            className="text-muted-foreground hover:text-foreground focus:text-foreground focus:bg-accent cursor-pointer rounded-lg"
          >
            {r.label}
          </DropdownMenuItem>
        ))}

        <div className="my-2 border-t border-border" />

        {/* PDF */}
        <div className="px-2 py-1.5 mb-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest">
            <File className="h-3 w-3" />
            PDF Report
          </div>
        </div>
        {rangeOptions.map((r) => (
          <DropdownMenuItem
            key={`pdf-${r.value}`}
            onClick={() => handleExport("pdf", r.value)}
            className="text-muted-foreground hover:text-foreground focus:text-foreground focus:bg-accent cursor-pointer rounded-lg"
          >
            {r.label}
          </DropdownMenuItem>
        ))}

        <div className="my-2 border-t border-border" />

        {/* Excel */}
        <div className="px-2 py-1.5 mb-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest">
            <FileSpreadsheet className="h-3 w-3" />
            Excel
          </div>
        </div>
        {rangeOptions.map((r) => (
          <DropdownMenuItem
            key={`xlsx-${r.value}`}
            onClick={() => handleExport("excel", r.value)}
            className="text-muted-foreground hover:text-foreground focus:text-foreground focus:bg-accent cursor-pointer rounded-lg"
          >
            {r.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
