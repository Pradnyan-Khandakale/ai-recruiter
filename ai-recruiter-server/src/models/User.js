const mongoose = require("mongoose");

// TODO: Define the fields: name, email (unique, lowercase), password,
// TODO: role ("recruiter" | "admin"), created_at.
const userSchema = new mongoose.Schema({});

module.exports = mongoose.model("User", userSchema);
