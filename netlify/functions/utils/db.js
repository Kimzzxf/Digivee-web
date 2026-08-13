import mongoose from "mongoose";

// Serverless functions can be re-invoked on a "warm" container that still
// holds the previous connection in memory. We cache the connection promise
// on the global scope so repeated invocations reuse it instead of opening a
// new connection (and exhausting MongoDB Atlas's connection limit) every time.
let cached = globalThis._mongooseConn;
if (!cached) {
  cached = globalThis._mongooseConn = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI belum diisi di environment variables.");
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 8000,
        bufferCommands: false,
      })
      .then((m) => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
