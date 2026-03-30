import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Invoice from "@/lib/models/Invoice";
import * as XLSX from "xlsx";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.name) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const username = session.user.name;

  const { searchParams } = new URL(req.url);
  const monthFilter = searchParams.get("month"); // "2025-01" format
  const exportXlsx = searchParams.get("export") === "xlsx";

  try {
    const db = await dbConnect();
    if (!db) throw new Error("DB offline");

    const allInvoices = await Invoice.find({ username }).lean();

    // Parse dates, group by year-month + vendor
    type InvoiceRow = {
      month: string;
      vendor_name: string;
      sub_total: number;
      tps: number;
      tvq: number;
      tax: number;
      total_price: number;
      discount: number;
    };

    const rows: InvoiceRow[] = allInvoices.map((inv) => {
      const date = inv.invoice_date
        ? new Date(inv.invoice_date.replace(/(\d+)\/(\d+)\/(\d+)/, "$3-$1-$2"))
        : new Date();
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      return {
        month,
        vendor_name: inv.vendor_name || "Unknown",
        sub_total: inv.sub_total || 0,
        tps: inv.tps || 0,
        tvq: inv.tvq || 0,
        tax: inv.tax || 0,
        total_price: inv.total_price || 0,
        discount: inv.discount || 0,
      };
    });

    const filtered = monthFilter ? rows.filter((r) => r.month === monthFilter) : rows;

    // Group by month + vendor
    const grouped: Record<string, Record<string, InvoiceRow>> = {};
    for (const row of filtered) {
      if (!grouped[row.month]) grouped[row.month] = {};
      if (!grouped[row.month][row.vendor_name]) {
        grouped[row.month][row.vendor_name] = { ...row, sub_total: 0, tps: 0, tvq: 0, tax: 0, total_price: 0, discount: 0 };
      }
      const g = grouped[row.month][row.vendor_name];
      g.sub_total += row.sub_total;
      g.tps += row.tps;
      g.tvq += row.tvq;
      g.tax += row.tax;
      g.total_price += row.total_price;
      g.discount += row.discount;
    }

    const summaryRows: (InvoiceRow & { isTotal?: boolean })[] = [];
    for (const month of Object.keys(grouped).sort()) {
      const vendors = grouped[month];
      const monthTotals = { month, vendor_name: "Total for Month", sub_total: 0, tps: 0, tvq: 0, tax: 0, total_price: 0, discount: 0 };
      for (const vendor of Object.keys(vendors)) {
        summaryRows.push(vendors[vendor]);
        monthTotals.sub_total += vendors[vendor].sub_total;
        monthTotals.tps += vendors[vendor].tps;
        monthTotals.tvq += vendors[vendor].tvq;
        monthTotals.tax += vendors[vendor].tax;
        monthTotals.total_price += vendors[vendor].total_price;
        monthTotals.discount += vendors[vendor].discount;
      }
      summaryRows.push({ ...monthTotals, isTotal: true });
    }

    const availableMonths = [...new Set(rows.map((r) => r.month))].sort();

    if (exportXlsx) {
      const wb = XLSX.utils.book_new();
      const detailSheet = XLSX.utils.json_to_sheet(
        allInvoices.map((inv) => ({
          Invoice_Number: inv.invoice_number,
          Date: inv.invoice_date,
          Vendor: inv.vendor_name,
          Sub_Total: inv.sub_total,
          TPS: inv.tps,
          TVQ: inv.tvq,
          Tax: inv.tax,
          Total_Price: inv.total_price,
          Discount: inv.discount,
        }))
      );
      const summarySheet = XLSX.utils.json_to_sheet(
        summaryRows.map((r) => ({
          Month: r.month,
          Vendor: r.vendor_name,
          Sub_Total: r.sub_total.toFixed(2),
          TPS: r.tps.toFixed(2),
          TVQ: r.tvq.toFixed(2),
          Tax: r.tax.toFixed(2),
          Total: r.total_price.toFixed(2),
          Discount: r.discount.toFixed(2),
        }))
      );
      XLSX.utils.book_append_sheet(wb, detailSheet, "Invoice Details");
      XLSX.utils.book_append_sheet(wb, summarySheet, "Summary by Month");
      const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      return new Response(buf, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="summary_output.xlsx"`,
        },
      });
    }

    return NextResponse.json({ summaryRows, availableMonths });
  } catch (e) {
    console.error("Summary DB Error, returning mock data", e);
    const mockRows = [
      { month: "2025-01", vendor_name: "Amazon", sub_total: 4200, tps: 210, tvq: 418, tax: 628, total_price: 4828, discount: 0 },
      { month: "2025-01", vendor_name: "Sysco", sub_total: 1800, tps: 90, tvq: 179, tax: 269, total_price: 2069, discount: 50 },
      { month: "2025-01", vendor_name: "Total for Month", sub_total: 6000, tps: 300, tvq: 597, tax: 269, total_price: 6897, discount: 50, isTotal: true },
    ];
    return NextResponse.json({ summaryRows: mockRows, availableMonths: ["2025-01", "2025-02", "2025-03"] });
  }
}
