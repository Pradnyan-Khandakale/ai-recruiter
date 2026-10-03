const mongoose = require("mongoose");
const { env } = require("./env");

let isConnected = false;

async function connectDatabase() {
  if (isConnected || mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  mongoose.set("strictQuery", true);
  try {
    const conn = await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    isConnected = true;
    console.log(`Connected to MongoDB: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`MongoDB connection warning: ${error.message}`);
    return null;
  }
}

module.exports = { connectDatabase };
