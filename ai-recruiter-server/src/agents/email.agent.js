const { Resend } = require("resend");
const { z } = require("zod");
const { env } = require("../config/env");
const { loadEmailSpec } = require("../utils/specLoader");
const geminiService = require("../services/gemini.service");

const EmailContentSchema = z.object({
  subject: z.string().min(5),
  body: z.string().min(10)
});

function renderTemplate(template, values = {}) {
  let result = String(template || "");
  for (const [key, val] of Object.entries(values)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    result = result.replace(regex, String(val ?? ""));
  }
  return result;
}

async function runEmailAgent({ candidate, job, shortlisting, options = {} }) {
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

  let subject = renderTemplate(templateSubject, values);
  let body = renderTemplate(templateBody, values);

  const isStrict = Boolean(options.strict || process.env.REQUIRE_GEMINI === "true");
  try {
    const prompt = `Compose a professional candidate email:
Candidate Name: ${candidateName}
Job Title: ${jobTitle}
Status: ${isShortlisted ? "Shortlisted for Interview" : "Application Not Selected"}
Template guide:
Subject: ${subject}
Body: ${body}
Return structured JSON with personalized subject and body adhering to schema.`;

    const geminiRes = await geminiService.generateStructuredJson({
      prompt,
      systemInstruction: "You are an executive talent recruiter. Write polished, respectful, personalized emails adhering to schema.",
      schema: EmailContentSchema,
      strict: isStrict
    });

    if (geminiRes.success && geminiRes.data?.body) {
      if (geminiRes.data.subject) subject = geminiRes.data.subject;
      body = geminiRes.data.body;
    } else if (isStrict) {
      throw new Error(geminiRes.error || "Gemini email generation failed");
    }
  } catch (err) {
    if (isStrict) {
      return {
        success: false,
        error: `Strict Gemini email generation failed: ${err.message}`,
        provider: "gemini"
      };
    }
  }

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
