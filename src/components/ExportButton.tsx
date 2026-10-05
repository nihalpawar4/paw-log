"use client";

import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Download,
  FileText,
  FileSpreadsheet,
  File,
  CalendarRange,
} from "lucide-react";
import { Entry, ExportRange } from "@/types";
import {
  exportAsCSV,
  exportAsPDF,
  exportAsExcel,
  getRangeLabel,
} from "@/lib/exports";
import { toast } from "sonner";
import { format } from "date-fns";

interface ExportButtonProps {
  entries: Entry[];
  userName: string;
}

export default function ExportButton({ entries, userName }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pendingType, setPendingType] = useState<"csv" | "pdf" | "excel">(
    "csv"
  );
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);

  const handleExport = async (
    type: "csv" | "pdf" | "excel",
    range: ExportRange,
    customFrom?: Date,
    customTo?: Date
  ) => {
    setExporting(true);
    try {
      switch (type) {
        case "csv":
          exportAsCSV(entries, range, customFrom, customTo);
          break;
        case "pdf":
          await exportAsPDF(entries, range, userName, customFrom, customTo);
          break;
        case "excel":
          await exportAsExcel(entries, range, customFrom, customTo);
          break;
      }
      const label = getRangeLabel(range, customFrom, customTo);
      toast.success(`Exported ${type.toUpperCase()} — ${label}`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const openCustomPicker = (type: "csv" | "pdf" | "excel") => {
    setPendingType(type);
    setFromDate(undefined);
    setToDate(undefined);
    setShowDatePicker(true);
  };

  const handleCustomExport = () => {
    if (!fromDate || !toDate) {
      toast.error("Please select both start and end dates.");
      return;
    }
    if (fromDate > toDate) {
      toast.error("Start date must be before end date.");
      return;
    }
    setShowDatePicker(false);
    handleExport(pendingType, "custom", fromDate, toDate);
  };

  const rangeOptions: { label: string; value: ExportRange }[] = [
    { label: "Last 30 Days", value: "last30" },
    { label: "This Month", value: "thisMonth" },
    { label: "All Time", value: "allTime" },
  ];

  const formatTypes: {
    type: "csv" | "pdf" | "excel";
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      type: "csv",
      label: "CSV",
      icon: <FileText className="h-3 w-3" />,
    },
    {
      type: "pdf",
      label: "PDF Report",
      icon: <File className="h-3 w-3" />,
    },
    {
      type: "excel",
      label: "Excel",
      icon: <FileSpreadsheet className="h-3 w-3" />,
    },
  ];

  return (
    <>
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
          {formatTypes.map((ft, idx) => (
            <React.Fragment key={ft.type}>
              {idx > 0 && <div className="my-2 border-t border-border" />}

              <div className="px-2 py-1.5 mb-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest">
                  {ft.icon}
                  {ft.label}
                </div>
              </div>

              {/* Preset ranges */}
              {rangeOptions.map((r) => (
                <DropdownMenuItem
                  key={`${ft.type}-${r.value}`}
                  onClick={() => handleExport(ft.type, r.value)}
                  className="text-muted-foreground hover:text-foreground focus:text-foreground focus:bg-accent cursor-pointer rounded-lg"
                >
                  {r.label}
                </DropdownMenuItem>
              ))}

              {/* Custom date range option */}
              <DropdownMenuItem
                onClick={() => openCustomPicker(ft.type)}
                className="text-muted-foreground hover:text-foreground focus:text-foreground focus:bg-accent cursor-pointer rounded-lg"
              >
                <CalendarRange className="h-3.5 w-3.5 mr-1.5 opacity-60" />
                Custom Date Range…
              </DropdownMenuItem>
            </React.Fragment>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Custom Date Range Dialog */}
      <Dialog open={showDatePicker} onOpenChange={setShowDatePicker}>
        <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-tight">
              Select Date Range
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Export as{" "}
              <span className="font-medium text-foreground uppercase">
                {pendingType}
              </span>{" "}
              for a custom date range
            </p>
          </DialogHeader>

          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            {/* From Date */}
            <div className="flex-1">
              <label className="text-xs text-muted-foreground uppercase tracking-widest mb-2 block">
                From
              </label>
              <div className="rounded-lg border border-border overflow-hidden">
                <Calendar
                  mode="single"
                  selected={fromDate}
                  onSelect={setFromDate}
                  disabled={(date) => date > new Date()}
                  className="w-full"
                />
              </div>
              {fromDate && (
                <p className="text-xs text-muted-foreground mt-1.5 text-center">
                  {format(fromDate, "dd MMM yyyy")}
                </p>
              )}
            </div>

            {/* To Date */}
            <div className="flex-1">
              <label className="text-xs text-muted-foreground uppercase tracking-widest mb-2 block">
                To
              </label>
              <div className="rounded-lg border border-border overflow-hidden">
                <Calendar
                  mode="single"
                  selected={toDate}
                  onSelect={setToDate}
                  disabled={(date) =>
                    date > new Date() || (fromDate ? date < fromDate : false)
                  }
                  className="w-full"
                />
              </div>
              {toDate && (
                <p className="text-xs text-muted-foreground mt-1.5 text-center">
                  {format(toDate, "dd MMM yyyy")}
                </p>
              )}
            </div>
          </div>

          {/* Selected range preview */}
          {fromDate && toDate && (
            <div className="mt-2 px-3 py-2 rounded-lg bg-accent/50 border border-border">
              <p className="text-sm text-foreground text-center">
                {format(fromDate, "dd MMM yyyy")} →{" "}
                {format(toDate, "dd MMM yyyy")}
              </p>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowDatePicker(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={!fromDate || !toDate || exporting}
              onClick={handleCustomExport}
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting ? "Exporting…" : "Export"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
