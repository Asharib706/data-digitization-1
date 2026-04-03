import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Invoice from "@/lib/models/Invoice";
import { Types } from "mongoose";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.name) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const username = session.user.name;

  try {
    await dbConnect();
    const result = await Invoice.deleteOne({
      _id: new Types.ObjectId(id),
      username,
    });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Not found or no permission" }, { status: 404 });
    }
    return NextResponse.json({ message: "Invoice deleted" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.name) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const username = session.user.name;

  try {
    await dbConnect();
    const body = await req.json();
    const allowedFields = ["vendor_name", "invoice_number", "invoice_date", "sub_total", "tps", "tvq", "tax", "total_price", "discount"];
    const update: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) update[field] = body[field];
    }
    const result = await Invoice.findOneAndUpdate(
      { _id: new Types.ObjectId(id), username },
      { $set: update },
      { new: true }
    );
    if (!result) return NextResponse.json({ error: "Not found or no permission" }, { status: 404 });
    return NextResponse.json({ message: "Invoice updated", invoice: result });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
  }
}

