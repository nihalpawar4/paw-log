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

/**
 * Export entries as CSV and trigger download.
 */
export function exportAsCSV(entries: Entry[], range: ExportRange): void {
  const filtered = filterByRange(entries, range);
  const headers = [
    "Date",
    "Time",
    "Brand",
    "Show",
    "Duration (MM:SS)",
    "Corrections",
  ];

  const rows = filtered.map((e) => [
    format(e.date.toDate(), "yyyy-MM-dd"),
    `"${e.time || ""}"`,
    `"${(e.brand || e.topic || "").replace(/"/g, '""')}"`,
    `"${(e.show || "").replace(/"/g, '""')}"`,
    formatTime(e.totalSeconds),
    `"${(e.corrections || e.description || e.notes || "").replace(/"/g, '""')}"`,
  ]);

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
  const doc = new jsPDF({ orientation: "landscape" });

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
  doc.line(20, 78, 275, 78);

  // Table
  autoTable(doc, {
    startY: 85,
    head: [["Date", "Time", "Brand", "Show", "Duration", "Corrections"]],
    body: filtered.map((e) => {
      const corr = e.corrections || e.description || e.notes || "";
      return [
      format(e.date.toDate(), "MMM d, yyyy"),
      e.time || "-",
      e.brand || e.topic || "-",
      e.show || "-",
      formatTime(e.totalSeconds),
      corr
        ? corr.length > 50
          ? corr.substring(0, 50) + "..."
          : corr
        : "-",
    ];}),
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
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 25 },
      2: { cellWidth: 40 },
      3: { cellWidth: 45 },
      4: { cellWidth: 25 },
      5: { cellWidth: "auto" },
    },
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

  const data = filtered.map((e) => ({
    Date: format(e.date.toDate(), "yyyy-MM-dd"),
    Time: e.time || "",
    Brand: e.brand || e.topic || "",
    Show: e.show || "",
    "Duration (MM:SS)": formatTime(e.totalSeconds),
    Corrections: e.corrections || e.description || e.notes || "",
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "MyRegister Entries");

  // Set column widths
  ws["!cols"] = [
    { wch: 12 },
    { wch: 10 },
    { wch: 20 },
    { wch: 25 },
    { wch: 14 },
    { wch: 40 },
  ];

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
