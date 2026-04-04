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
    throw new Error("MONGODB_URI is missing. Please configure your database connection string.");
  }

  if (!cached.promise) {
    const opts = { bufferCommands: false };
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    console.error("MongoDB Connection Failed:", e instanceof Error ? e.message : e);
    cached.promise = null; // Allow retry
    throw new Error("Failed to connect to database.");
  }
  return cached.conn;
}

export default dbConnect;
