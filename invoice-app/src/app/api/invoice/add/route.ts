import { NextResponse } from "next/server";
import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Invoice from "@/lib/models/Invoice";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.name) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const username = session.user.name;

  try {
    const body = await req.json();
    const db = await dbConnect();
    
    if (db) {
        const invoice = await Invoice.create({ ...body, username });
        return NextResponse.json(invoice, { status: 201 });
    } else {
        throw new Error("DB connection failed");
    }
  } catch (e: any) {
    console.error("Add Invoice Error:", e);
    return NextResponse.json({ error: e.message || "Failed to add invoice" }, { status: 500 });
  }
}
