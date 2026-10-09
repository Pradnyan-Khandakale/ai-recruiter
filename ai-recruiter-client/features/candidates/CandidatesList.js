"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Users, FileText, ExternalLink, Filter, X, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export function CandidatesList() {
  const searchParams = useSearchParams();
  const filterJobId = searchParams.get("jobId");

  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadCandidates() {
    try {
      setLoading(true);
      setError("");
      const params = filterJobId ? { jobId: filterJobId } : undefined;
      const data = await api.listCandidates(params);
      setCandidates(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Failed to load candidates");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCandidates();
  }, [filterJobId]);

  const filteredJobTitle =
    filterJobId && candidates.length > 0
      ? candidates[0]?.job_id?.title
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">Candidates & Applications</h1>
          <p className="text-slate-600">
            Review applicant profiles, contact details, and submitted resumes for your positions.
          </p>
        </div>

        {filterJobId && (
          <Link
            href="/dashboard/candidates"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <X size={14} /> Clear job filter
          </Link>
        )}
      </div>

      {filterJobId && (
        <div className="flex items-center gap-2 rounded-md bg-teal-50 px-4 py-2 text-sm text-teal-900 border border-teal-200">
          <Filter size={16} className="text-teal-700" />
          <span>
            Filtering applications for:{" "}
            <strong className="font-semibold">{filteredJobTitle || filterJobId}</strong>
          </span>
        </div>
      )}

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}

      {loading && (
        <div className="flex items-center justify-center p-12 text-slate-500">
          Loading candidates...
        </div>
      )}

      {!loading && candidates.length === 0 && (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <Users className="mb-3 text-slate-400" size={40} />
          <h3 className="text-lg font-bold text-slate-800">No applications received yet</h3>
          <p className="mt-1 text-sm text-slate-500">
            {filterJobId
              ? "No candidates have applied to this specific job yet."
              : "When candidates submit their profiles through your public apply links, they will appear here."}
          </p>
          <Link
            href="/dashboard/jobs"
            className="mt-4 inline-flex h-9 items-center gap-2 rounded-md bg-emerald-700 px-3 text-xs font-semibold text-white hover:bg-emerald-800"
          >
            View jobs & copy apply links
          </Link>
        </Card>
      )}

      <div className="grid gap-4">
        {candidates.map((candidate) => {
          const resumeLink = candidate.resume_url
            ? `${API_BASE}${candidate.resume_url}`
            : null;

          return (
            <Card
              key={candidate._id}
              className="border-slate-200 p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">{candidate.name}</h2>
                    <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100 uppercase text-[10px] tracking-wider">
                      {candidate.status || "applied"}
                    </Badge>
                  </div>

                  <p className="text-sm text-slate-600">
                    <span className="font-medium text-slate-800">{candidate.email}</span> •{" "}
                    <span>{candidate.phone}</span>
                  </p>

                  {candidate.job_id && (
                    <p className="text-xs font-medium text-teal-700">
                      Applied for:{" "}
                      <span className="font-semibold text-slate-800">
                        {candidate.job_id.title}
                      </span>
                    </p>
                  )}

                  {candidate.created_at && (
                    <p className="text-xs text-slate-400">
                      Submitted on: {new Date(candidate.created_at).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {resumeLink ? (
                    <a
                      href={resumeLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <FileText size={15} className="text-teal-700" />
                      View resume PDF
                      <ExternalLink size={12} className="text-slate-400" />
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">No resume attached</span>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
