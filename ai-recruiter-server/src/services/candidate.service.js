const mongoose = require("mongoose");
const Candidate = require("../models/Candidate");
const Application = require("../models/Application");
const Job = require("../models/Job");

async function uploadCandidate(payload, file) {
  if (!file) {
    throw Object.assign(new Error("Resume PDF file is required"), { statusCode: 400 });
  }

  if (!payload.job_id || !mongoose.Types.ObjectId.isValid(payload.job_id)) {
    throw Object.assign(new Error("Invalid job ID format"), { statusCode: 400 });
  }

  const job = await Job.findById(payload.job_id);
  if (!job) {
    throw Object.assign(new Error("Job not found"), { statusCode: 404 });
  }

  if (job.status !== "published" || job.is_published === false) {
    throw Object.assign(new Error("Job is not open for applications"), { statusCode: 400 });
  }

  const email = payload.email.toLowerCase().trim();
  const name = payload.name.trim();
  const phone = payload.phone.trim();
  const resumeUrl = `/uploads/${file.filename}`;

  // Check if candidate already exists
  let candidate = await Candidate.findOne({ email });

  if (candidate) {
    // Check for duplicate application for this job
    const existingApp = await Application.findOne({
      job_id: job._id,
      candidate_id: candidate._id
    });

    if (existingApp) {
      throw Object.assign(
        new Error("You have already applied for this position"),
        { statusCode: 409 }
      );
    }

    // Update candidate details with latest submission
    candidate.name = name;
    candidate.phone = phone;
    candidate.job_id = job._id;
    candidate.resume_url = resumeUrl;
    await candidate.save();
  } else {
    // Create new candidate
    candidate = await Candidate.create({
      name,
      email,
      phone,
      job_id: job._id,
      resume_url: resumeUrl,
      status: "applied"
    });
  }

  // Create Application linking Candidate and Job
  const application = await Application.create({
    candidate_id: candidate._id,
    job_id: job._id,
    recruiter_id: job.created_by,
    resume_url: resumeUrl,
    status: "applied",
    source: "public_portal",
    submitted_information: {
      name,
      email,
      phone
    }
  });

  return {
    candidate,
    application,
    message: "Application submitted successfully"
  };
}

async function listCandidates(user, options = {}) {
  let filter = {};

  if (user.role !== "admin") {
    // Find all jobs owned by this recruiter
    const userJobs = await Job.find({ created_by: user.id }).select("_id");
    const jobIds = userJobs.map((j) => j._id);

    if (options.job_id) {
      const isJobOwned = jobIds.some((id) => id.toString() === options.job_id.toString());
      if (!isJobOwned) {
        throw Object.assign(
          new Error("Forbidden: You do not have permission to view candidates for this job"),
          { statusCode: 403 }
        );
      }
      filter = { job_id: options.job_id };
    } else {
      filter = { job_id: { $in: jobIds } };
    }
  } else if (options.job_id) {
    filter = { job_id: options.job_id };
  }

  return Candidate.find(filter)
    .populate("job_id", "title company status created_by")
    .sort({ created_at: -1 });
}

async function getCandidate(id, user) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw Object.assign(new Error("Invalid candidate ID format"), { statusCode: 400 });
  }

  const candidate = await Candidate.findById(id).populate("job_id", "title company status created_by");
  if (!candidate) {
    throw Object.assign(new Error("Candidate not found"), { statusCode: 404 });
  }

  if (user.role !== "admin") {
    const ownsJob = candidate.job_id && candidate.job_id.created_by?.toString() === user.id;
    const hasApplication = await Application.exists({
      candidate_id: candidate._id,
      recruiter_id: user.id
    });

    if (!ownsJob && !hasApplication) {
      throw Object.assign(
        new Error("Forbidden: You do not have permission to view this candidate"),
        { statusCode: 403 }
      );
    }
  }

  const applications = await Application.find({ candidate_id: candidate._id })
    .populate("job_id", "title company status")
    .sort({ created_at: -1 });

  return {
    ...candidate.toObject(),
    applications
  };
}

async function listApplications(jobId, user) {
  if (!mongoose.Types.ObjectId.isValid(jobId)) {
    throw Object.assign(new Error("Invalid job ID format"), { statusCode: 400 });
  }

  const job = await Job.findById(jobId);
  if (!job) {
    throw Object.assign(new Error("Job not found"), { statusCode: 404 });
  }

  if (job.created_by.toString() !== user.id && user.role !== "admin") {
    throw Object.assign(
      new Error("Forbidden: You do not have permission to view applications for this job"),
      { statusCode: 403 }
    );
  }

  return Application.find({ job_id: jobId })
    .populate("candidate_id")
    .sort({ created_at: -1 });
}

module.exports = {
  uploadCandidate,
  listCandidates,
  getCandidate,
  listApplications
};
