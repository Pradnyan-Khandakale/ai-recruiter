const mongoose = require("mongoose");

// TODO: Define the fields: title, description, required_skills, preferred_skills,
// TODO: min_experience, workflow_spec_id, hiring_spec_id, created_by, created_at.
const jobSchema = new mongoose.Schema({});

module.exports = mongoose.model("Job", jobSchema);
