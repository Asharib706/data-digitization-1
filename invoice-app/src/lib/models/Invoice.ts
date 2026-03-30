import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInvoice extends Document {
  username: string;
  invoice_number: string;
  invoice_date: string;
  vendor_name: string;
  sub_total: number;
  tps: number;
  tvq: number;
  tax: number;
  total_price: number;
  discount: number;
}

const InvoiceSchema: Schema = new Schema({
  username: { type: String, required: true, index: true },
  invoice_number: { type: String },
  invoice_date: { type: String },
  vendor_name: { type: String },
  sub_total: { type: Number, default: 0 },
  tps: { type: Number, default: 0 },
  tvq: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total_price: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
});

const Invoice: Model<IInvoice> =
  mongoose.models.Invoice ||
  mongoose.model<IInvoice>("Invoice", InvoiceSchema, "product_details");

export default Invoice;
