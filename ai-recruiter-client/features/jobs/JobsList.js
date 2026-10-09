"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Plus,
  Copy,
  Check,
  BriefcaseBusiness,
  Users,
  Edit,
  Eye,
  Trash2,
  Globe
} from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function JobsList() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  async function loadJobs() {
    try {
      setLoading(true);
      setError("");
      const data = await api.listJobs();
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
  }, []);

  async function copyApplyLink(jobId) {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/jobs/${jobId}/apply`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(jobId);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      // Fallback
      prompt("Copy apply link:", url);
    }
  }

  async function toggleStatus(job) {
    const newStatus = job.status === "published" ? "draft" : "published";
    try {
      await api.updateJob(job._id, { status: newStatus });
      setJobs((prev) =>
        prev.map((j) => (j._id === job._id ? { ...j, status: newStatus, is_published: newStatus === "published" } : j))
      );
    } catch (err) {
      alert(err?.message || "Failed to update job status");
    }
  }

  async function handleDelete(jobId) {
    if (!confirm("Are you sure you want to delete this job?")) return;
    try {
      await api.deleteJob(jobId);
      setJobs((prev) => prev.filter((j) => j._id !== jobId));
    } catch (err) {
      alert(err?.message || "Failed to delete job");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Jobs</h1>
          <p className="text-slate-600">
            Manage open positions, toggle publication status, and view candidate applications.
          </p>
        </div>
        <Link
          href="/dashboard/jobs/create"
          className="inline-flex h-10 items-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800"
        >
          <Plus size={18} />
          Create job
        </Link>
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      {loading && (
        <div className="flex items-center justify-center p-12 text-slate-500">
          Loading jobs...
        </div>
      )}

      {!loading && jobs.length === 0 && (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <BriefcaseBusiness className="mb-3 text-slate-400" size={40} />
          <h3 className="text-lg font-bold text-slate-800">No jobs created yet</h3>
          <p className="mt-1 text-sm text-slate-500">
            Get started by creating your first job opening to receive candidate applications.
          </p>
          <Link
            href="/dashboard/jobs/create"
            className="mt-4 inline-flex h-9 items-center gap-2 rounded-md bg-emerald-700 px-3 text-xs font-semibold text-white hover:bg-emerald-800"
          >
            <Plus size={16} /> Create job
          </Link>
        </Card>
      )}

      <div className="grid gap-4">
        {jobs.map((job) => (
          <Card key={job._id} className="border-slate-200 p-5 shadow-sm transition hover:shadow-md">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900">{job.title}</h2>
                  <Badge
                    className={
                      job.status === "published"
                        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                        : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                    }
                  >
                    {job.status === "published" ? "Published" : "Draft"}
                  </Badge>
                  {job.employment_type && (
                    <span className="text-xs font-medium text-slate-500">
                      • {job.employment_type}
                    </span>
                  )}
                  {job.min_experience !== undefined && (
                    <span className="text-xs font-medium text-slate-500">
                      • {job.min_experience}+ yrs exp
                    </span>
                  )}
                </div>

                <p className="max-w-3xl text-sm text-slate-600 line-clamp-2">
                  {job.description}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(job.required_skills || []).map((skill) => (
                    <span
                      key={skill}
                      className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700"
                    >
                      {skill}
                    </span>
                  ))}
                  {(job.preferred_skills || []).map((skill) => (
                    <span
                      key={skill}
                      className="rounded bg-cyan-50 px-2 py-0.5 text-xs font-medium text-cyan-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleStatus(job)}
                  title={job.status === "published" ? "Unpublish to Draft" : "Publish to Public"}
                >
                  <Globe size={15} />
                  {job.status === "published" ? "Unpublish" : "Publish"}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyApplyLink(job._id)}
                  title="Copy public candidate apply page link"
                >
                  {copiedId === job._id ? (
                    <>
                      <Check size={15} className="text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={15} />
                      <span>Copy link</span>
                    </>
                  )}
                </Button>

                <Link
                  href={`/jobs/${job._id}`}
                  target="_blank"
                  className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  title="View Public Page"
                >
                  <Eye size={15} />
                  Public view
                </Link>

                <Link
                  href={`/dashboard/candidates?jobId=${job._id}`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md bg-teal-50 px-3 text-xs font-semibold text-teal-800 hover:bg-teal-100"
                >
                  <Users size={15} />
                  Applications
                </Link>

                <Link
                  href={`/dashboard/jobs/${job._id}/edit`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  title="Edit Job"
                >
                  <Edit size={14} />
                </Link>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(job._id)}
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  title="Delete Job"
                >
                  <Trash2 size={15} />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
