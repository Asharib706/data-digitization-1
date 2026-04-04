import { auth } from "@/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dbConnect from "@/lib/db";
import Invoice from "@/lib/models/Invoice";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const PROMPT = `
Extract specific fields from a clear and non-blurry image if it represents an invoice or financial report. 
If the image is blurry, return an error message indicating that the image is unacceptable for processing. 
Focus on extracting the following information accurately and structuring it in the specified JSON format.

Fields to Extract:
1. vendor_name: Extract the name of the vendor or the title of the invoice/receipt. If missing, set to "None".
2. invoice_number: Extract the unique identifier for the invoice or receipt. If missing, set to "None".
3. invoice_date: Extract the invoice date in MM/DD/YYYY format. If unavailable, default to today's date.
4. sub_total: Extract the subtotal amount. If unavailable, use total_price.
5. tps: Extract the TPS (Goods and Services Tax) value — rightmost numeric value on the TPS line. If unavailable, set to 0. Must not contain %.
6. tvq: Extract the TVQ (Quebec Sales Tax) value — rightmost numeric value on the TVQ line. If unavailable, set to 0. Must not contain %. TVQ should always be higher than TPS.
7. tax: Calculate as tps + tvq. If either is missing, set to 0.
8. total_price: Extract the final amount after taxes and discounts. If unavailable, set to 0.
9. discount: Extract any discounts. If none, set to 0.

Return ONLY this JSON structure, no markdown:
{
  "vendor_name": "value or None",
  "invoice_number": "value or None",
  "invoice_date": "MM/DD/YYYY",
  "data": [
    {
      "sub_total": 0,
      "tps": 0,
      "tvq": 0,
      "tax": 0,
      "total_price": 0,
      "discount": 0
    }
  ]
}
`;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.name) {
    return new Response("Unauthorized", { status: 401 });
  }
  const username = session.user.name;

  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) {
    return new Response("No file provided", { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        send({ type: "progress", percent: 10, message: "Uploading file..." });

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        send({ type: "progress", percent: 25, message: "Sending to Gemini..." });

        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your-gemini-api-key") {
            throw new Error("Missing GEMINI_API_KEY. Please configure your API key.");
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        send({ type: "progress", percent: 40, message: "Gemini 2.5 Flash is reading the invoice..." });

        const imageData = {
          inlineData: {
            data: buffer.toString("base64"),
            mimeType: file.type || "image/jpeg",
          },
        };

        send({ type: "progress", percent: 65, message: "Extracting fields..." });

        const result = await model.generateContent([PROMPT, imageData]);
        const text = result.response.text();

        send({ type: "progress", percent: 85, message: "Parsing extracted data..." });

        const start = text.indexOf("{");
        const end = text.lastIndexOf("}") + 1;
        const invoiceData = JSON.parse(text.slice(start, end));

        try {
            await dbConnect();
            for (const item of invoiceData.data) {
              await Invoice.updateOne(
                {
                  invoice_number: invoiceData.invoice_number,
                  invoice_date: invoiceData.invoice_date,
                  vendor_name: invoiceData.vendor_name,
                  username,
                },
                { $set: { ...item, username } },
                { upsert: true }
              );
            }
        } catch (dbErr) {
            console.warn("Extraction: Failed to save to DB (quota?), but returning result anyway.", dbErr);
        }

        send({ type: "progress", percent: 100, message: "Done!" });
        send({ type: "result", data: invoiceData });
      } catch (err: any) {
        console.error("Extraction error:", err);
        const errorMessage = err?.message || "Internal server error during extraction.";
        send({ type: "error", message: errorMessage });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
