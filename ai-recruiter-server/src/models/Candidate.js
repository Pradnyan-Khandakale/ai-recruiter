const mongoose = require("mongoose");

// TODO: Define the fields: job_id, name, email, phone, resume_url,
// TODO: parsed_resume_json, match_score, status, created_at.
const candidateSchema = new mongoose.Schema({});

module.exports = mongoose.model("Candidate", candidateSchema);
