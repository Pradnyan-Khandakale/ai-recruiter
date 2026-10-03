const { Resend } = require("resend");
const { env } = require("../config/env");
const { loadEmailSpec } = require("../utils/specLoader");

function renderTemplate(template, values) {
  // TODO: Replace every {{placeholder}} in the template with the matching value.
  return template;
}

async function runEmailAgent({ candidate, job, shortlisting }) {
  // TODO: Pick the rejection or interview-invite template, render the subject and body,
  // TODO: return the fallback payload when no Resend key is configured, and otherwise
  // TODO: send the email and report the provider message id.
  throw new Error("Email agent is not implemented yet");
}

module.exports = { runEmailAgent };
