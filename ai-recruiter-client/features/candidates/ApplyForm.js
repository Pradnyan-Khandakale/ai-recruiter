"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  FileText,
  Loader2,
  Mail,
  Phone,
  UploadCloud,
  User,
  ArrowLeft,
  BriefcaseBusiness
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function ApplyForm() {
  const { jobId } = useParams();
  const formRef = useRef(null);

  const [job, setJob] = useState(null);
  const [jobLoading, setJobLoading] = useState(true);
  const [jobError, setJobError] = useState("");

  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fileName, setFileName] = useState("");
  const [submittedCandidate, setSubmittedCandidate] = useState(null);

  useEffect(() => {
    if (!jobId) return;

    async function loadJob() {
      try {
        setJobLoading(true);
        setJobError("");
        const data = await api.getJob(jobId);
        setJob(data);
      } catch (err) {
        setJobError(err?.message || "Job not found or is closed to applications");
      } finally {
        setJobLoading(false);
      }
    }

    loadJob();
  }, [jobId]);

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      setFileName("");
      return;
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please select a valid PDF file");
      event.target.value = "";
      setFileName("");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Resume file size must be less than 5MB");
      event.target.value = "";
      setFileName("");
      return;
    }

    setError("");
    setFileName(file.name);
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (submitting) return;

    setError("");
    setStatus("");

    const formData = new FormData(event.currentTarget);
    const resumeFile = formData.get("resume");

    if (!resumeFile || (resumeFile instanceof File && resumeFile.size === 0)) {
      setError("Please upload your resume PDF");
      return;
    }

    try {
      setSubmitting(true);
      const result = await api.uploadCandidate(formData);

      setStatus(result?.message || "Application submitted successfully!");
      setSubmittedCandidate(result?.candidate || { name: formData.get("name") });
      if (formRef.current) {
        formRef.current.reset();
      }
      setFileName("");
    } catch (err) {
      setError(err?.message || "Failed to submit application. Please check your details and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (jobLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700">
        <Loader2 className="mr-2 animate-spin text-teal-700" size={24} />
        Loading application form...
      </main>
    );
  }

  if (jobError || !job) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
        <div className="max-w-md space-y-4">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-red-100 text-red-600">
            <BriefcaseBusiness size={28} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Application Unavailable</h1>
          <p className="text-sm text-slate-600">
            {jobError || "This job is currently not accepting applications."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#ccfbf1,transparent_32%),linear-gradient(135deg,#f8fafc,#eef2ff)] px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <Link
            href={`/jobs/${jobId}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-800 hover:underline"
          >
            <ArrowLeft size={16} /> View job details
          </Link>
        </div>

        <div className="rounded-lg border border-white/80 bg-white/75 p-6 shadow-sm backdrop-blur">
          <Badge className="bg-teal-100 text-teal-800 border-teal-200">Public application</Badge>
          <h1 className="mt-3 text-3xl font-bold text-slate-950">{job.title}</h1>
          <p className="mt-1 text-sm font-medium text-teal-700">{job.company || "Hiring Team"}</p>
          <p className="mt-2 text-slate-600">
            Submit your profile and resume directly to our recruitment team.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {["Profile Information", "Resume Submission", "Recruiter Review"].map((step) => (
              <div
                key={step}
                className="flex items-center gap-2 rounded-md border border-teal-100 bg-teal-50 px-3 py-2 text-sm font-bold text-teal-800"
              >
                <CheckCircle2 size={17} />
                {step}
              </div>
            ))}
          </div>
        </div>

        {submittedCandidate && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-emerald-900 shadow-sm">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 text-emerald-600" size={24} />
              <div>
                <h3 className="text-lg font-bold">Application Received!</h3>
                <p className="mt-1 text-sm text-emerald-800">
                  Thank you, <span className="font-semibold">{submittedCandidate.name}</span>. Your application for <span className="font-semibold">{job.title}</span> has been successfully recorded. Our recruiters will review your qualifications.
                </p>
              </div>
            </div>
          </div>
        )}

        <Card className="overflow-hidden border-white bg-white/90 p-0 shadow-md">
          <form ref={formRef} onSubmit={onSubmit} className="grid gap-0 md:grid-cols-[1fr_300px]">
            <input type="hidden" name="job_id" value={jobId} readOnly />

            <div className="space-y-4 p-5 md:p-6">
              <label className="block text-sm font-semibold text-slate-700">
                Full Name
                <div className="relative mt-2">
                  <User
                    className="pointer-events-none absolute left-3 top-2.5 text-slate-400"
                    size={18}
                  />
                  <Input
                    className="pl-10 focus:border-teal-600"
                    name="name"
                    placeholder="e.g. Jane Doe"
                    required
                  />
                </div>
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Email Address
                <div className="relative mt-2">
                  <Mail
                    className="pointer-events-none absolute left-3 top-2.5 text-slate-400"
                    size={18}
                  />
                  <Input
                    className="pl-10 focus:border-teal-600"
                    type="email"
                    name="email"
                    placeholder="e.g. jane.doe@example.com"
                    required
                  />
                </div>
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Phone Number
                <div className="relative mt-2">
                  <Phone
                    className="pointer-events-none absolute left-3 top-2.5 text-slate-400"
                    size={18}
                  />
                  <Input
                    className="pl-10 focus:border-teal-600"
                    name="phone"
                    placeholder="e.g. +1 555-0199"
                    required
                  />
                </div>
              </label>

              {error && (
                <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                  {error}
                </p>
              )}

              {status && (
                <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
                  {status}
                </p>
              )}

              <Button
                type="submit"
                className="bg-teal-700 hover:bg-teal-800"
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <UploadCloud size={18} />
                )}
                {submitting ? "Submitting application..." : "Submit application"}
              </Button>
            </div>

            <aside className="border-t border-slate-200 bg-gradient-to-b from-cyan-50 to-emerald-50 p-5 md:border-l md:border-t-0">
              <label className="flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-teal-300 bg-white/70 p-5 text-center transition hover:border-teal-500 hover:bg-white">
                <UploadCloud className="mb-3 text-teal-700" size={34} />
                <span className="text-sm font-bold text-slate-900">Upload Resume</span>
                <span className="mt-1 text-xs text-slate-500">PDF file only (Max 5MB)</span>
                <Input
                  className="sr-only"
                  type="file"
                  name="resume"
                  accept="application/pdf"
                  required
                  onChange={handleFileChange}
                />
                {fileName ? (
                  <span className="mt-4 inline-flex max-w-full items-center gap-2 rounded-md bg-teal-100 px-3 py-2 text-xs font-bold text-teal-800">
                    <FileText size={16} />
                    <span className="truncate">{fileName}</span>
                  </span>
                ) : (
                  <span className="mt-4 inline-flex items-center rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-teal-700 shadow-sm border border-teal-200">
                    Browse PDF
                  </span>
                )}
              </label>
            </aside>
          </form>
        </Card>
      </div>
    </main>
  );
}
