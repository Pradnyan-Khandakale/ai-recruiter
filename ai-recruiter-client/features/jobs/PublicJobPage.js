"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, BriefcaseBusiness, MapPin, Clock, Calendar, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function PublicJobPage() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!jobId) return;

    async function loadJob() {
      try {
        setLoading(true);
        setError("");
        const data = await api.getJob(jobId);
        setJob(data);
      } catch (err) {
        setError(err?.message || "Job not found or is no longer accepting applications");
      } finally {
        setLoading(false);
      }
    }

    loadJob();
  }, [jobId]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-slate-400">Loading job details...</p>
      </main>
    );
  }

  if (error || !job) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 text-center text-white">
        <div className="max-w-md space-y-4">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-red-950/80 text-red-400">
            <BriefcaseBusiness size={28} />
          </div>
          <h1 className="text-2xl font-bold">Job Not Available</h1>
          <p className="text-sm text-slate-400">
            {error || "This position may have been closed or is not currently open for public applications."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
        <div className="mb-6 flex size-14 items-center justify-center rounded-md bg-emerald-600">
          <BriefcaseBusiness size={28} />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-emerald-400">
          <span className="font-semibold">{job.company || "Hiring Team"}</span>
          <span>•</span>
          <span className="inline-flex items-center gap-1 text-slate-300">
            <MapPin size={14} /> {job.location || "Remote"}
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1 text-slate-300">
            <Clock size={14} /> {job.employment_type || "Full-time"}
          </span>
        </div>

        <h1 className="mt-3 max-w-3xl text-4xl font-bold md:text-5xl">{job.title}</h1>

        <div className="mt-6 max-w-3xl space-y-4 text-base leading-relaxed text-slate-300 md:text-lg">
          <p className="whitespace-pre-line">{job.description}</p>
        </div>

        <div className="mt-8 space-y-3">
          <p className="text-sm font-bold uppercase tracking-wider text-slate-400">Required Skills</p>
          <div className="flex flex-wrap gap-2">
            {(job.required_skills || []).map((skill) => (
              <Badge key={skill} className="bg-emerald-950 text-emerald-300 border-emerald-800">
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        {job.preferred_skills && job.preferred_skills.length > 0 && (
          <div className="mt-6 space-y-3">
            <p className="text-sm font-bold uppercase tracking-wider text-slate-400">Preferred Skills</p>
            <div className="flex flex-wrap gap-2">
              {job.preferred_skills.map((skill) => (
                <Badge key={skill} className="bg-white/10 text-white">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Card className="mt-10 max-w-3xl border-slate-800 bg-white text-slate-950 shadow-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Public Application</p>
              <p className="font-bold text-slate-900">Direct candidate submission — no account required</p>
            </div>
            <Link
              href={`/jobs/${job._id}/apply`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-emerald-700 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
            >
              Apply now <ArrowRight size={18} />
            </Link>
          </div>
        </Card>
      </section>
    </main>
  );
}
