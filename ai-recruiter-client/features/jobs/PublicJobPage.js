"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, BriefcaseBusiness } from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function PublicJobPage() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // TODO: Load the public job details for jobId and store the error message on failure.
  }, [jobId]);

  if (error) return <main className="p-8 text-red-700">{error}</main>;
  if (!job) return <main className="p-8 text-slate-700">Loading job...</main>;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
        <div className="mb-6 flex size-14 items-center justify-center rounded-md bg-emerald-600">
          <BriefcaseBusiness size={28} />
        </div>
        <h1 className="max-w-3xl text-5xl font-bold">{job.title}</h1>
        <p className="mt-5 max-w-3xl text-lg text-slate-300">{job.description}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {(job.required_skills || []).map((skill) => <Badge key={skill} className="bg-white/10 text-white">{skill}</Badge>)}
        </div>
        <Card className="mt-8 max-w-3xl bg-white text-slate-950">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-500">Public candidate route</p>
              <p className="font-bold">Apply without recruiter authentication</p>
            </div>
            <Link href={`/jobs/${job._id}/apply`} className="inline-flex h-10 items-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800">
              Apply now <ArrowRight size={18} />
            </Link>
          </div>
        </Card>
      </section>
    </main>
  );
}
