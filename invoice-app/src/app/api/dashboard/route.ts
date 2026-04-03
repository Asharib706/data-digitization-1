import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Invoice from "@/lib/models/Invoice";

export async function GET() {
  const session = await auth();
  if (!session?.user?.name) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const username = session.user.name;

  try {
    const db = await dbConnect();
    if (!db) throw new Error("DB offline");
    
    const [invoices, totalAgg] = await Promise.all([
      Invoice.find({ username }).sort({ _id: -1 }).limit(5).lean(),
      Invoice.aggregate([
        { $match: { username } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalSpend: { $sum: "$total_price" },
            totalTax: { $sum: "$tax" },
            totalDiscount: { $sum: "$discount" },
            totalSubTotal: { $sum: "$sub_total" },
          },
        },
      ]),
    ]);

    const vendors = await Invoice.aggregate([
      { $match: { username } },
      { $group: { _id: "$vendor_name", totalSpend: { $sum: "$total_price" } } },
      { $sort: { totalSpend: -1 } },
      { $limit: 3 },
    ]);

    const agg = totalAgg[0] || { count: 0, totalSpend: 0, totalTax: 0, totalDiscount: 0, totalSubTotal: 0 };
    const avgDiscount = agg.count > 0 && agg.totalSubTotal > 0
      ? ((agg.totalDiscount / agg.totalSubTotal) * 100).toFixed(1)
      : "0.0";

    const maxVendorSpend = vendors[0]?.totalSpend || 1;

    return NextResponse.json({
      stats: {
        totalInvoices: agg.count,
        totalSpend: agg.totalSpend,
        totalTax: agg.totalTax,
        avgDiscount: `${avgDiscount}%`,
      },
      recentInvoices: invoices.map((inv) => ({
        id: inv._id.toString(),
        vendor: inv.vendor_name,
        invoiceNumber: inv.invoice_number,
        date: inv.invoice_date,
        total: inv.total_price,
      })),
      topVendors: vendors.map((v) => ({
        name: v._id,
        totalSpend: v.totalSpend,
        barPercent: Math.round((v.totalSpend / maxVendorSpend) * 100),
      })),
    });
  } catch (e) {
    console.error("Dashboard DB Error:", e);
    return NextResponse.json({ error: "db_error", message: "Unable to connect to database. Please check your connection." }, { status: 503 });
  }
}
