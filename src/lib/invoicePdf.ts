import PDFDocument from "pdfkit";
import { prisma } from "@/lib/db";

interface InvoiceData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  tierName: string;
  tierPrice: number;
  optionsPrice: number;
  oneTimeFees: number;
  totalPrice: number;
  paymentMethod: string;
  confirmedAt: Date | null;
  createdAt: Date;
  selectedOptions?: Record<string, string> | null;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatCurrency(amount: number): string {
  return `€${amount.toFixed(2)}`;
}

export async function generateInvoicePdf(order: InvoiceData): Promise<Buffer> {
  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  const siteName = settings?.siteName || "DashCore";
  const contactEmail = settings?.contactEmail || "info@dashcore.eu";

  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    const doc = new PDFDocument({ size: "A4", margin: 50 });

    doc.on("data", (chunk: Uint8Array) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const purple = "#6366f1";
    const darkText = "#1e293b";
    const grayText = "#64748b";
    const lightBg = "#f8fafc";
    const borderColor = "#e2e8f0";

    const pageWidth = 595.28;
    const margin = 50;
    const contentWidth = pageWidth - margin * 2;

    // Header bar
    doc.rect(0, 0, pageWidth, 80).fill(purple);
    doc.font("Helvetica-Bold").fontSize(28).fillColor("#ffffff");
    doc.text(siteName, margin, 26, { width: contentWidth / 2 });
    doc.font("Helvetica").fontSize(12).fillColor("#e0e7ff");
    doc.text("INVOICE", pageWidth - margin - 120, 32, { width: 120, align: "right" });

    // Invoice details row
    const detailsY = 100;
    doc.fillColor(darkText).font("Helvetica-Bold").fontSize(10);
    doc.text("Invoice Number:", margin, detailsY);
    doc.font("Helvetica").text(`INV-${order.orderId}`, margin + 110, detailsY);

    doc.font("Helvetica-Bold").text("Date:", margin, detailsY + 16);
    doc.font("Helvetica").text(
      formatDate(order.confirmedAt || order.createdAt),
      margin + 110,
      detailsY + 16
    );

    doc.font("Helvetica-Bold").text("Order ID:", margin, detailsY + 32);
    doc.font("Helvetica").text(order.orderId, margin + 110, detailsY + 32);

    doc.font("Helvetica-Bold").text("Payment:", margin, detailsY + 48);
    doc.font("Helvetica").text(
      order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1),
      margin + 110,
      detailsY + 48
    );

    // Bill To section
    const billToY = detailsY;
    const rightCol = pageWidth - margin - 200;
    doc.font("Helvetica-Bold").fontSize(10).fillColor(grayText);
    doc.text("BILL TO", rightCol, billToY);
    doc.font("Helvetica").fontSize(10).fillColor(darkText);
    doc.text(order.customerName, rightCol, billToY + 16);
    doc.text(order.customerEmail, rightCol, billToY + 32);

    // Divider
    const divY = detailsY + 75;
    doc.moveTo(margin, divY).lineTo(pageWidth - margin, divY).strokeColor(borderColor).lineWidth(1).stroke();

    // Table header
    const tableY = divY + 15;
    doc.rect(margin, tableY, contentWidth, 28).fill(purple);
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#ffffff");
    doc.text("Description", margin + 12, tableY + 8, { width: 250 });
    doc.text("Qty", margin + 280, tableY + 8, { width: 50, align: "center" });
    doc.text("Unit Price", margin + 340, tableY + 8, { width: 80, align: "right" });
    doc.text("Amount", margin + 430, tableY + 8, { width: 60, align: "right" });

    // Table rows
    let rowY = tableY + 28;
    const rowH = 28;

    const drawRow = (desc: string, qty: string, unitPrice: string, amount: string, bg?: string) => {
      if (bg) doc.rect(margin, rowY, contentWidth, rowH).fill(bg);
      doc.font("Helvetica").fontSize(9).fillColor(darkText);
      doc.text(desc, margin + 12, rowY + 9, { width: 250 });
      doc.text(qty, margin + 280, rowY + 9, { width: 50, align: "center" });
      doc.text(unitPrice, margin + 340, rowY + 9, { width: 80, align: "right" });
      doc.text(amount, margin + 430, rowY + 9, { width: 60, align: "right" });
      doc.moveTo(margin, rowY + rowH).lineTo(pageWidth - margin, rowY + rowH).strokeColor(borderColor).lineWidth(0.5).stroke();
      rowY += rowH;
    };

    drawRow(`${order.tierName} Plan`, "1", formatCurrency(order.tierPrice), formatCurrency(order.tierPrice), lightBg);

    if (order.optionsPrice > 0) {
      drawRow("Additional Options", "1", formatCurrency(order.optionsPrice), formatCurrency(order.optionsPrice));
    }

    if (order.oneTimeFees > 0) {
      drawRow("One-Time Setup Fees", "1", formatCurrency(order.oneTimeFees), formatCurrency(order.oneTimeFees), lightBg);
    }

    // Selected options detail
    if (order.selectedOptions && typeof order.selectedOptions === "object") {
      const opts = order.selectedOptions as Record<string, string>;
      for (const [key, value] of Object.entries(opts)) {
        if (value) {
          drawRow(`  - ${key}: ${value}`, "", "", "", rowY % 2 === 0 ? lightBg : undefined);
        }
      }
    }

    // Totals section
    rowY += 8;
    const totalsX = margin + 330;
    const totalsW = contentWidth - 330;

    if (order.optionsPrice > 0 || order.oneTimeFees > 0) {
      doc.font("Helvetica").fontSize(9).fillColor(grayText);
      doc.text("Subtotal:", totalsX, rowY, { width: 80, align: "right" });
      doc.fillColor(darkText).text(formatCurrency(order.tierPrice), totalsX + 90, rowY, { width: totalsW - 90, align: "right" });
      rowY += 18;

      if (order.optionsPrice > 0) {
        doc.fillColor(grayText).text("Options:", totalsX, rowY, { width: 80, align: "right" });
        doc.fillColor(darkText).text(formatCurrency(order.optionsPrice), totalsX + 90, rowY, { width: totalsW - 90, align: "right" });
        rowY += 18;
      }

      if (order.oneTimeFees > 0) {
        doc.fillColor(grayText).text("Setup Fees:", totalsX, rowY, { width: 80, align: "right" });
        doc.fillColor(darkText).text(formatCurrency(order.oneTimeFees), totalsX + 90, rowY, { width: totalsW - 90, align: "right" });
        rowY += 18;
      }
    }

    // Total box
    rowY += 4;
    doc.rect(totalsX, rowY, contentWidth - 330 + 10, 32).fill(purple);
    doc.font("Helvetica-Bold").fontSize(12).fillColor("#ffffff");
    doc.text("TOTAL", totalsX + 12, rowY + 9, { width: 80 });
    doc.text(formatCurrency(order.totalPrice || order.tierPrice + order.optionsPrice + order.oneTimeFees), totalsX + 90, rowY + 9, { width: totalsW - 80, align: "right" });

    // Status badge
    rowY += 50;
    doc.rect(margin, rowY, 120, 24).fill("#f0fdf4");
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#16a34a");
    doc.text("PAID", margin + 8, rowY + 7, { width: 104 });

    // Footer
    const footerY = 760;
    doc.moveTo(margin, footerY).lineTo(pageWidth - margin, footerY).strokeColor(borderColor).lineWidth(0.5).stroke();
    doc.font("Helvetica").fontSize(8).fillColor(grayText);
    doc.text(`${siteName} | ${contactEmail}`, margin, footerY + 10, { width: contentWidth, align: "center" });
    doc.text("Thank you for your business!", margin, footerY + 22, { width: contentWidth, align: "center" });

    doc.end();
  });
}
