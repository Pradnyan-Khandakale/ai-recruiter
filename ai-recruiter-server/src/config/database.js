const mongoose = require("mongoose");
const { env } = require("./env");

async function connectDatabase() {
  // TODO: Set mongoose strictQuery and connect to env.mongoUri.
  console.warn("connectDatabase is not implemented yet - running without a database connection");
}

module.exports = { connectDatabase };
