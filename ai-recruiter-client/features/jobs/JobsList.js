"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function JobsList() {
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    // TODO: Load the job list from the API and store the error message on failure.
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Jobs</h1>
          <p className="text-slate-600">Public application links are generated from each job id.</p>
        </div>
        <Link href="/dashboard/jobs/create" className="inline-flex h-10 items-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800">
          <Plus size={18} />Create job
        </Link>
      </div>
      {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
      <div className="grid gap-4">
        {jobs.map((job) => (
          <Card key={job._id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">{job.title}</h2>
                <p className="mt-1 max-w-3xl text-sm text-slate-600">{job.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(job.required_skills || []).map((skill) => <Badge key={skill}>{skill}</Badge>)}
                </div>
              </div>
              <Button variant="outline" onClick={() => copyApplyLink(job._id)}>
                <ExternalLink size={18} />Copy apply link
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function copyApplyLink(jobId) {
  // TODO: Copy `${window.location.origin}/jobs/${jobId}/apply` to the clipboard.
}
