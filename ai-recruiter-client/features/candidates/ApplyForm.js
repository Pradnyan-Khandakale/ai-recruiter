"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, FileText, Loader2, Mail, Phone, UploadCloud, User } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function ApplyForm() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    // TODO: Load the public job details for jobId so the form can be submitted.
  }, [jobId]);

  async function onSubmit(event) {
    event.preventDefault();
    // TODO: Build the FormData with the job id and resume, upload it, report the workflow
    // TODO: status, reset the form, and surface any error message.
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#ccfbf1,transparent_32%),linear-gradient(135deg,#f8fafc,#eef2ff)] px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-lg border border-white/80 bg-white/75 p-6 shadow-sm backdrop-blur">
          <Badge>Public application</Badge>
          <h1 className="mt-3 text-3xl font-bold text-slate-950">{job?.title || "Apply"}</h1>
          <p className="mt-2 text-slate-600">Candidate profile and resume submission.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {["Resume parse", "Skill match", "Human review"].map((step) => (
              <div key={step} className="flex items-center gap-2 rounded-md border border-teal-100 bg-teal-50 px-3 py-2 text-sm font-bold text-teal-800">
                <CheckCircle2 size={17} />
                {step}
              </div>
            ))}
          </div>
        </div>
        <Card className="overflow-hidden border-white bg-white/90 p-0 shadow-md">
          <form onSubmit={onSubmit} className="grid gap-0 md:grid-cols-[1fr_300px]">
            <input type="hidden" name="job_id" value={jobId} readOnly />
            <div className="space-y-4 p-5 md:p-6">
              <label className="block text-sm font-semibold text-slate-700">Name<div className="relative mt-2"><User className="pointer-events-none absolute left-3 top-2.5 text-slate-400" size={18} /><Input className="pl-10 focus:border-teal-600" name="name" required /></div></label>
              <label className="block text-sm font-semibold text-slate-700">Email<div className="relative mt-2"><Mail className="pointer-events-none absolute left-3 top-2.5 text-slate-400" size={18} /><Input className="pl-10 focus:border-teal-600" type="email" name="email" required /></div></label>
              <label className="block text-sm font-semibold text-slate-700">Phone<div className="relative mt-2"><Phone className="pointer-events-none absolute left-3 top-2.5 text-slate-400" size={18} /><Input className="pl-10 focus:border-teal-600" name="phone" required /></div></label>
              {error && <p className="rounded-md bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
              {status && <p className="rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{status}</p>}
              <Button className="bg-teal-700 hover:bg-teal-800" disabled={submitting}>
                {submitting ? <Loader2 className="animate-spin" size={18} /> : <UploadCloud size={18} />}
                {submitting ? "Processing..." : "Submit application"}
              </Button>
            </div>
            <aside className="border-t border-slate-200 bg-gradient-to-b from-cyan-50 to-emerald-50 p-5 md:border-l md:border-t-0">
              <label className="flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-teal-300 bg-white/70 p-5 text-center transition hover:border-teal-500 hover:bg-white">
                <UploadCloud className="mb-3 text-teal-700" size={34} />
                <span className="text-sm font-bold text-slate-900">Resume PDF</span>
                <span className="mt-1 text-xs text-slate-500">PDF file</span>
                <Input
                  className="sr-only"
                  type="file"
                  name="resume"
                  accept="application/pdf"
                  required
                  onChange={(event) => setFileName(event.target.files?.[0]?.name || "")}
                />
                {fileName && (
                  <span className="mt-4 inline-flex max-w-full items-center gap-2 rounded-md bg-teal-100 px-3 py-2 text-xs font-bold text-teal-800">
                    <FileText size={16} />
                    <span className="truncate">{fileName}</span>
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
