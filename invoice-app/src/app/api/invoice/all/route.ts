import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Invoice from "@/lib/models/Invoice";

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
