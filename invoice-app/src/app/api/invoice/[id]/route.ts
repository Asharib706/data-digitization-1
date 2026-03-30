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
