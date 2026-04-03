import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Invoice from "@/lib/models/Invoice";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.name) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const username = session.user.name;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const sortBy = searchParams.get("sort") || "date_desc";

  try {
    await dbConnect();

    const query: Record<string, unknown> = { username };
    if (search) {
      query.$or = [
        { vendor_name: { $regex: search, $options: "i" } },
        { invoice_number: { $regex: search, $options: "i" } },
      ];
    }

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      date_desc: { _id: -1 },
      date_asc: { _id: 1 },
      amount_desc: { total_price: -1 },
      amount_asc: { total_price: 1 },
    };

    const invoices = await Invoice.find(query)
      .sort(sortMap[sortBy] || { _id: -1 })
      .lean();

    return NextResponse.json({
      invoices: invoices.map((inv) => ({
        id: inv._id.toString(),
        vendor_name: inv.vendor_name || "",
        invoice_number: inv.invoice_number || "",
        invoice_date: inv.invoice_date || "",
        sub_total: inv.sub_total || 0,
        tps: inv.tps || 0,
        tvq: inv.tvq || 0,
        tax: inv.tax || 0,
        total_price: inv.total_price || 0,
        discount: inv.discount || 0,
      })),
      total: invoices.length,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "db_error" }, { status: 503 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.name) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const username = session.user.name;

  try {
    const body = await req.json();
    if (body.confirm !== "DELETE") {
      return NextResponse.json({ error: "Confirmation required" }, { status: 400 });
    }
    await dbConnect();
    const result = await Invoice.deleteMany({ username });
    return NextResponse.json({ message: `Deleted ${result.deletedCount} invoices` });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete invoices" }, { status: 500 });
  }
}
