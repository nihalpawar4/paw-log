import { Entry, ExportRange } from "@/types";
import { format, subDays, startOfMonth } from "date-fns";
import { formatTime } from "./analytics";

/**
 * Filter entries by export range preset.
 */
function filterByRange(entries: Entry[], range: ExportRange): Entry[] {
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
    case "allTime":
    default:
      return entries;
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
 * Export entries as CSV and trigger download.
 */
export function exportAsCSV(entries: Entry[], range: ExportRange): void {
  const filtered = filterByRange(entries, range);
  const columns = getActiveColumns(filtered);

  const headers = columns.map((c) => c.header);

  const rows = filtered.map((e) =>
    columns.map((col) => {
      const val = col.getValue(e);
      // Wrap in quotes and escape internal quotes for CSV
      if (col.key === "date" || col.key === "duration") return val;
      return `"${val.replace(/"/g, '""')}"`;
    })
  );

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  downloadFile(csv, `myregister-export-${range}-${format(new Date(), "yyyy-MM-dd")}.csv`, "text/csv");
}

/**
 * Export entries as PDF using jsPDF.
 */
export async function exportAsPDF(
  entries: Entry[],
  range: ExportRange,
  userName: string
): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const filtered = filterByRange(entries, range);
  const columns = getActiveColumns(filtered);

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
  doc.text(
    `Report: ${range === "last30" ? "Last 30 Days" : range === "thisMonth" ? "This Month" : "All Time"}`,
    20,
    52
  );
  doc.text(`Generated: ${format(new Date(), "MMMM d, yyyy")}`, 20, 59);
  doc.text(`Total Entries: ${filtered.length}`, 20, 66);

  const totalSeconds = filtered.reduce((sum, e) => sum + e.totalSeconds, 0);
  doc.text(`Total Duration: ${formatTime(totalSeconds)}`, 20, 73);

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

  // Table
  autoTable(doc, {
    startY: 85,
    head: [columns.map((c) => c.header)],
    body: filtered.map((e) =>
      columns.map((col) => {
        const val = col.getValue(e);
        if (col.key === "corrections" && val.length > 60) {
          return val.substring(0, 60) + "...";
        }
        return val || "-";
      })
    ),
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
    theme: "grid",
    columnStyles,
  });

  doc.save(`myregister-report-${range}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}

/**
 * Export entries as Excel (.xlsx).
 */
export async function exportAsExcel(
  entries: Entry[],
  range: ExportRange
): Promise<void> {
  const XLSX = await import("xlsx");
  const filtered = filterByRange(entries, range);
  const columns = getActiveColumns(filtered);

  const data = filtered.map((e) => {
    const row: Record<string, string> = {};
    columns.forEach((col) => {
      row[col.header] = col.getValue(e);
    });
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "MyRegister Entries");

  // Set column widths dynamically
  ws["!cols"] = columns.map((col) => ({ wch: col.colWidth }));

  XLSX.writeFile(
    wb,
    `myregister-export-${range}-${format(new Date(), "yyyy-MM-dd")}.xlsx`
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
