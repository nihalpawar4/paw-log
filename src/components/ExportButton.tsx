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
  CalendarDays,
} from "lucide-react";
import { Entry, ExportRange } from "@/types";
import {
  exportAsCSV,
  exportAsPDF,
  exportAsExcel,
  getRangeLabel,
} from "@/lib/exports";
import { toast } from "sonner";
import { format, parse, isValid } from "date-fns";

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
  const [fromInput, setFromInput] = useState("");
  const [toInput, setToInput] = useState("");
  const [activeField, setActiveField] = useState<"from" | "to">("from");

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
    setFromInput("");
    setToInput("");
    setActiveField("from");
    setShowDatePicker(true);
  };

  const handleFromDateSelect = (date: Date | undefined) => {
    setFromDate(date);
    if (date) {
      setFromInput(format(date, "dd/MM/yyyy"));
      setActiveField("to");
    }
  };

  const handleToDateSelect = (date: Date | undefined) => {
    setToDate(date);
    if (date) {
      setToInput(format(date, "dd/MM/yyyy"));
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (activeField === "from") {
      handleFromDateSelect(date);
    } else {
      handleToDateSelect(date);
    }
  };

  const parseInputDate = (value: string): Date | undefined => {
    // Try dd/MM/yyyy
    let parsed = parse(value, "dd/MM/yyyy", new Date());
    if (isValid(parsed)) return parsed;
    // Try yyyy-MM-dd
    parsed = parse(value, "yyyy-MM-dd", new Date());
    if (isValid(parsed)) return parsed;
    // Try dd-MM-yyyy
    parsed = parse(value, "dd-MM-yyyy", new Date());
    if (isValid(parsed)) return parsed;
    return undefined;
  };

  const handleFromInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFromInput(val);
    const parsed = parseInputDate(val);
    if (parsed && parsed <= new Date()) {
      setFromDate(parsed);
    }
  };

  const handleToInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setToInput(val);
    const parsed = parseInputDate(val);
    if (parsed && parsed <= new Date()) {
      setToDate(parsed);
    }
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

  // Determine which month to show on calendar based on active field
  const calendarMonth =
    activeField === "to" && fromDate ? fromDate : undefined;

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

      {/* Custom Date Range Dialog — single calendar, mobile-friendly */}
      <Dialog open={showDatePicker} onOpenChange={setShowDatePicker}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-sm mx-auto bg-card border-border text-foreground p-4 sm:p-6 max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-semibold tracking-tight flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              Select Date Range
            </DialogTitle>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Export as{" "}
              <span className="font-medium text-foreground uppercase">
                {pendingType}
              </span>
            </p>
          </DialogHeader>

          {/* Date input fields */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest mb-1 block">
                From
              </label>
              <input
                type="text"
                placeholder="dd/mm/yyyy"
                value={fromInput}
                onChange={handleFromInputChange}
                onFocus={() => setActiveField("from")}
                className={`w-full px-3 py-2 text-sm rounded-lg border bg-background text-foreground placeholder:text-muted-foreground/40 outline-none transition-colors ${
                  activeField === "from"
                    ? "border-foreground/40 ring-1 ring-foreground/10"
                    : "border-border"
                }`}
              />
            </div>
            <div>
              <label className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-widest mb-1 block">
                To
              </label>
              <input
                type="text"
                placeholder="dd/mm/yyyy"
                value={toInput}
                onChange={handleToInputChange}
                onFocus={() => setActiveField("to")}
                className={`w-full px-3 py-2 text-sm rounded-lg border bg-background text-foreground placeholder:text-muted-foreground/40 outline-none transition-colors ${
                  activeField === "to"
                    ? "border-foreground/40 ring-1 ring-foreground/10"
                    : "border-border"
                }`}
              />
            </div>
          </div>

          {/* Single shared calendar */}
          <div className="mt-3 flex justify-center">
            <div className="rounded-lg border border-border overflow-hidden w-full max-w-[280px]">
              <Calendar
                mode="single"
                selected={activeField === "from" ? fromDate : toDate}
                onSelect={handleCalendarSelect}
                defaultMonth={calendarMonth}
                disabled={(date) => {
                  if (date > new Date()) return true;
                  if (activeField === "to" && fromDate && date < fromDate)
                    return true;
                  return false;
                }}
                className="w-full"
              />
            </div>
          </div>

          {/* Active field indicator */}
          <p className="text-center text-xs text-muted-foreground mt-1">
            Selecting{" "}
            <button
              onClick={() => setActiveField("from")}
              className={`font-medium transition-colors ${
                activeField === "from"
                  ? "text-foreground underline underline-offset-2"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              start
            </button>
            {" / "}
            <button
              onClick={() => setActiveField("to")}
              className={`font-medium transition-colors ${
                activeField === "to"
                  ? "text-foreground underline underline-offset-2"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              end
            </button>{" "}
            date
          </p>

          {/* Selected range preview */}
          {fromDate && toDate && (
            <div className="mt-2 px-3 py-2 rounded-lg bg-accent/50 border border-border">
              <p className="text-xs sm:text-sm text-foreground text-center font-medium">
                {format(fromDate, "dd MMM yyyy")} →{" "}
                {format(toDate, "dd MMM yyyy")}
              </p>
            </div>
          )}

          <div className="flex gap-3 mt-3">
            <Button
              variant="outline"
              className="flex-1 text-sm"
              onClick={() => setShowDatePicker(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 text-sm"
              disabled={!fromDate || !toDate || exporting}
              onClick={handleCustomExport}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              {exporting ? "Exporting…" : "Export"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
