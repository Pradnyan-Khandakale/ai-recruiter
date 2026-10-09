const { Resend } = require("resend");
const { env } = require("../config/env");
const { loadEmailSpec } = require("../utils/specLoader");

function renderTemplate(template, values = {}) {
  let result = String(template || "");
  for (const [key, val] of Object.entries(values)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    result = result.replace(regex, String(val ?? ""));
  }
  return result;
}

async function runEmailAgent({ candidate, job, shortlisting }) {
  const isShortlisted = shortlisting?.data?.status === "shortlisted";
  const templateName = isShortlisted ? "interview-invite" : "rejection";
  const emailSpec = loadEmailSpec(templateName);

  const candidateName = candidate?.name || "Candidate";
  const jobTitle = job?.title || "Applied Position";

  const defaultSubject = isShortlisted
    ? "Invitation for Interview: {{job_title}}"
    : "Application Update: {{job_title}}";

  const rawSubject = emailSpec?.subject || defaultSubject;
  const templateSubject = rawSubject.includes("{{") ? rawSubject : `${rawSubject} - {{job_title}}`;
  const templateBody = emailSpec?.body || (isShortlisted
    ? "Hello {{candidate_name}}, congratulations! You have been shortlisted for the {{job_title}} position."
    : "Hello {{candidate_name}}, thank you for your application to {{job_title}}. We have decided not to proceed at this time.");

  const values = {
    candidate_name: candidateName,
    job_title: jobTitle
  };

  const subject = renderTemplate(templateSubject, values);
  const body = renderTemplate(templateBody, values);

  if (!env.resendApiKey) {
    return {
      success: true,
      provider: "fallback",
      message: "Resend API key not configured; simulated email sent successfully",
      data: {
        to: candidate?.email || "candidate@example.com",
        subject,
        body
      }
    };
  }

  try {
    const resend = new Resend(env.resendApiKey);
    const { data, error } = await resend.emails.send({
      from: "recruiter@agentichire.com",
      to: candidate?.email || "candidate@example.com",
      subject,
      text: body
    });
    if (error) {
      return {
        success: false,
        error: error.message,
        provider: "resend"
      };
    }
    return {
      success: true,
      provider: "resend",
      data: {
        id: data?.id,
        to: candidate?.email,
        subject
      }
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      provider: "resend"
    };
  }
}

module.exports = { runEmailAgent, renderTemplate };
