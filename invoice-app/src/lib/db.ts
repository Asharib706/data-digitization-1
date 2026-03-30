import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "";

declare global {
  // eslint-disable-next-line no-var
  var mongoose: { conn: typeof import("mongoose") | null; promise: Promise<typeof import("mongoose")> | null };
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) return cached.conn;

  if (!MONGODB_URI) {
    console.warn("MONGODB_URI is missing, skipping DB connection (Demo Mode)");
    return null;
  }

  if (!cached.promise) {
    const opts = { bufferCommands: false };
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    console.error("MongoDB Connection Failed (Quota or URI):", e.message);
    cached.promise = null; // Allow retry or just keep returning null
    return null;
  }
  return cached.conn;
}

export default dbConnect;
