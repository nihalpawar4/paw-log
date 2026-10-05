import { Entry, ExportRange } from "@/types";
import { format, subDays, startOfMonth } from "date-fns";
import { formatTime } from "./analytics";

/**
 * Filter entries by export range preset or custom date range.
 */
function filterByRange(
  entries: Entry[],
  range: ExportRange,
  customFrom?: Date,
  customTo?: Date
): Entry[] {
  const now = new Date();

  switch (range) {
    case "last30": {
      const cutoff = subDays(now, 30);
      return entries.filter((e) => e.date.toDate() >= cutoff);
    }
    case "thisMonth": {
      const monthStart = startOfMonth(now);
      return entries.filter((e) => e.date.toDate() >= monthStart);
    }
    case "custom": {
      if (!customFrom || !customTo) return entries;
      const from = new Date(customFrom);
      from.setHours(0, 0, 0, 0);
      const to = new Date(customTo);
      to.setHours(23, 59, 59, 999);
      return entries.filter((e) => {
        const d = e.date.toDate();
        return d >= from && d <= to;
      });
    }
    case "allTime":
    default:
      return entries;
  }
}

/**
 * Get a human-readable label for the range.
 */
export function getRangeLabel(
  range: ExportRange,
  customFrom?: Date,
  customTo?: Date
): string {
  switch (range) {
    case "last30":
      return "Last 30 Days";
    case "thisMonth":
      return "This Month";
    case "custom":
      if (customFrom && customTo) {
        return `${format(customFrom, "dd MMM yyyy")} – ${format(customTo, "dd MMM yyyy")}`;
      }
      return "Custom Range";
    case "allTime":
    default:
      return "All Time";
  }
}

/** Column definition for dynamic export */
interface ExportColumn {
  key: string;
  header: string;
  getValue: (e: Entry) => string;
  colWidth: number; // for Excel
  pdfWidth?: number; // for PDF
}

/**
 * Get all possible columns and filter to only those that have data
 * in at least one entry.
 */
function getActiveColumns(entries: Entry[]): ExportColumn[] {
  const allColumns: ExportColumn[] = [
    {
      key: "date",
      header: "Date",
      getValue: (e) => format(e.date.toDate(), "yyyy-MM-dd"),
      colWidth: 12,
      pdfWidth: 30,
    },
    {
      key: "time",
      header: "Time",
      getValue: (e) => e.time || "",
      colWidth: 10,
      pdfWidth: 22,
    },
    {
      key: "brand",
      header: "Brand",
      getValue: (e) => e.brand || e.topic || "",
      colWidth: 20,
      pdfWidth: 40,
    },
    {
      key: "show",
      header: "Show",
      getValue: (e) => e.show || "",
      colWidth: 25,
      pdfWidth: 45,
    },
    {
      key: "duration",
      header: "Duration",
      getValue: (e) => formatTime(e.totalSeconds),
      colWidth: 14,
      pdfWidth: 25,
    },
    {
      key: "corrections",
      header: "Corrections",
      getValue: (e) => e.corrections || e.description || e.notes || "",
      colWidth: 40,
    },
  ];

  // Always include Date and Duration; for others, only include if at least one entry has data
  return allColumns.filter((col) => {
    if (col.key === "date" || col.key === "duration") return true;
    return entries.some((e) => {
      const val = col.getValue(e);
      return val && val.trim().length > 0;
    });
  });
}

/**
 * Compute summary stats for the filtered entries.
 */
function computeSummary(entries: Entry[]) {
  const totalSeconds = entries.reduce((sum, e) => sum + e.totalSeconds, 0);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = (totalSeconds / 3600).toFixed(1);
  return {
    totalEntries: entries.length,
    totalSeconds,
    totalMinutes,
    totalHours,
    totalDuration: formatTime(totalSeconds),
  };
}

/**
 * Export entries as CSV and trigger download.
 */
export function exportAsCSV(
  entries: Entry[],
  range: ExportRange,
  customFrom?: Date,
  customTo?: Date
): void {
  const filtered = filterByRange(entries, range, customFrom, customTo);
  const columns = getActiveColumns(filtered);
  const summary = computeSummary(filtered);

  const headers = columns.map((c) => c.header);

  const rows = filtered.map((e) =>
    columns.map((col) => {
      const val = col.getValue(e);
      // Wrap in quotes and escape internal quotes for CSV
      if (col.key === "date" || col.key === "duration") return val;
      return `"${val.replace(/"/g, '""')}"`;
    })
  );

  // Add empty separator row
  const emptyRow = columns.map(() => "");

  // Summary rows at the bottom
  const summaryRows = [
    emptyRow,
    buildSummaryRow(columns, "Total Entries", String(summary.totalEntries)),
    buildSummaryRow(columns, "Total Minutes", String(summary.totalMinutes)),
    buildSummaryRow(columns, "Total Hours", summary.totalHours),
    buildSummaryRow(columns, "Total Duration", summary.totalDuration),
  ];

  const csv = [
    headers.join(","),
    ...rows.map((r) => r.join(",")),
    ...summaryRows.map((r) => r.join(",")),
  ].join("\n");

  const rangeLabel = getRangeLabel(range, customFrom, customTo).replace(/\s/g, "-");
  downloadFile(
    csv,
    `myregister-export-${rangeLabel}-${format(new Date(), "yyyy-MM-dd")}.csv`,
    "text/csv"
  );
}

/** Build a summary row for CSV: puts label in first column and value in duration column */
function buildSummaryRow(columns: ExportColumn[], label: string, value: string): string[] {
  return columns.map((col, i) => {
    if (i === 0) return label;
    if (col.key === "duration") return value;
    return "";
  });
}

/**
 * Export entries as PDF using jsPDF.
 */
export async function exportAsPDF(
  entries: Entry[],
  range: ExportRange,
  userName: string,
  customFrom?: Date,
  customTo?: Date
): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const filtered = filterByRange(entries, range, customFrom, customTo);
  const columns = getActiveColumns(filtered);
  const summary = computeSummary(filtered);
  const rangeLabel = getRangeLabel(range, customFrom, customTo);

  // Use landscape if many columns, portrait if few
  const orientation = columns.length > 4 ? "landscape" : "portrait";
  const doc = new jsPDF({ orientation });
  const pageWidth = orientation === "landscape" ? 297 : 210;

  // Header
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("MyRegister", 20, 25);

  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.text("Your calm video editing journal", 20, 33);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Editor: ${userName}`, 20, 45);
  doc.text(`Report: ${rangeLabel}`, 20, 52);
  doc.text(`Generated: ${format(new Date(), "MMMM d, yyyy")}`, 20, 59);
  doc.text(`Total Entries: ${summary.totalEntries}`, 20, 66);
  doc.text(`Total Duration: ${summary.totalDuration}`, 20, 73);

  // Separator line
  doc.setDrawColor(200);
  doc.line(20, 78, pageWidth - 20, 78);

  // Build column styles dynamically
  const columnStyles: Record<number, { cellWidth: number | "auto" }> = {};
  columns.forEach((col, i) => {
    if (col.pdfWidth) {
      columnStyles[i] = { cellWidth: col.pdfWidth };
    } else {
      columnStyles[i] = { cellWidth: "auto" };
    }
  });

  // Build body rows + summary rows at bottom
  const bodyRows = filtered.map((e) =>
    columns.map((col) => {
      const val = col.getValue(e);
      if (col.key === "corrections" && val.length > 60) {
        return val.substring(0, 60) + "...";
      }
      return val || "-";
    })
  );

  // Add summary rows at the bottom of the table
  const summaryTableRows = [
    columns.map((col, i) => (i === 0 ? "" : "")), // empty separator
    columns.map((col, i) => {
      if (i === 0) return "TOTAL ENTRIES";
      if (col.key === "duration") return String(summary.totalEntries);
      return "";
    }),
    columns.map((col, i) => {
      if (i === 0) return "TOTAL MINUTES";
      if (col.key === "duration") return String(summary.totalMinutes);
      return "";
    }),
    columns.map((col, i) => {
      if (i === 0) return "TOTAL HOURS";
      if (col.key === "duration") return summary.totalHours;
      return "";
    }),
    columns.map((col, i) => {
      if (i === 0) return "TOTAL DURATION";
      if (col.key === "duration") return summary.totalDuration;
      return "";
    }),
  ];

  // Table
  autoTable(doc, {
    startY: 85,
    head: [columns.map((c) => c.header)],
    body: [...bodyRows, ...summaryTableRows],
    styles: {
      fontSize: 9,
      cellPadding: 4,
      textColor: [30, 30, 30],
      lineColor: [220, 220, 220],
    },
    headStyles: {
      fillColor: [0, 0, 0],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248],
    },
    // Style summary rows with bold text
    didParseCell: (data) => {
      const totalRowStart = bodyRows.length;
      if (data.section === "body" && data.row.index >= totalRowStart) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [235, 235, 235];
        data.cell.styles.textColor = [0, 0, 0];
      }
    },
    theme: "grid",
    columnStyles,
  });

  const fileSuffix = rangeLabel.replace(/\s/g, "-");
  doc.save(`myregister-report-${fileSuffix}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}

/**
 * Export entries as Excel (.xlsx).
 */
export async function exportAsExcel(
  entries: Entry[],
  range: ExportRange,
  customFrom?: Date,
  customTo?: Date
): Promise<void> {
  const XLSX = await import("xlsx");
  const filtered = filterByRange(entries, range, customFrom, customTo);
  const columns = getActiveColumns(filtered);
  const summary = computeSummary(filtered);

  const data = filtered.map((e) => {
    const row: Record<string, string> = {};
    columns.forEach((col) => {
      row[col.header] = col.getValue(e);
    });
    return row;
  });

  // Add empty separator row
  const emptyRow: Record<string, string> = {};
  columns.forEach((col) => {
    emptyRow[col.header] = "";
  });

  // Summary rows
  const summaryRows = [
    { label: "Total Entries", value: String(summary.totalEntries) },
    { label: "Total Minutes", value: String(summary.totalMinutes) },
    { label: "Total Hours", value: summary.totalHours },
    { label: "Total Duration", value: summary.totalDuration },
  ].map(({ label, value }) => {
    const row: Record<string, string> = {};
    columns.forEach((col, i) => {
      if (i === 0) row[col.header] = label;
      else if (col.key === "duration") row[col.header] = value;
      else row[col.header] = "";
    });
    return row;
  });

  const ws = XLSX.utils.json_to_sheet([...data, emptyRow, ...summaryRows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "MyRegister Entries");

  // Set column widths dynamically
  ws["!cols"] = columns.map((col) => ({ wch: col.colWidth }));

  const rangeLabel = getRangeLabel(range, customFrom, customTo).replace(/\s/g, "-");
  XLSX.writeFile(
    wb,
    `myregister-export-${rangeLabel}-${format(new Date(), "yyyy-MM-dd")}.xlsx`
  );
}

/** Helper: trigger file download in browser */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
