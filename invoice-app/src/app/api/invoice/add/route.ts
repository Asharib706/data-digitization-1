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
        throw new Error("DB offline");
    }
  } catch (e) {
    console.warn("Add Invoice DB Error or Quota, continuing in demo mode...", e);
    const body = await req.clone().json().catch(() => ({}));
    return NextResponse.json({ ...body, _id: "demo-" + Date.now() }, { status: 201 });
  }
}
