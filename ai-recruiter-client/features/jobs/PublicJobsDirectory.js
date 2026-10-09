"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  MapPin,
  Clock,
  ArrowRight,
  Search,
  Building2,
  Sparkles
} from "lucide-react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export function PublicJobsDirectory() {
  const [jobs, setJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchPublicJobs() {
      try {
        setLoading(true);
        setError("");
        const data = await api.listJobs({ public: true });
        setJobs(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err?.message || "Failed to load open positions. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchPublicJobs();
  }, []);

  const filteredJobs = jobs.filter((job) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const titleMatch = job.title?.toLowerCase().includes(query);
    const companyMatch = job.company?.toLowerCase().includes(query);
    const locationMatch = job.location?.toLowerCase().includes(query);
    const skillsMatch = (job.required_skills || []).some((s) =>
      s.toLowerCase().includes(query)
    );
    return titleMatch || companyMatch || locationMatch || skillsMatch;
  });

  return (
    <main className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500 selection:text-white">
      {/* Header section */}
      <header className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/jobs" className="flex items-center gap-2.5 font-bold text-lg text-white">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm shadow-emerald-500/20">
              <BriefcaseBusiness size={20} />
            </div>
            <span>Careers</span>
          </Link>
          <Link
            href="/login"
            className="text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            Recruiter Portal &rarr;
          </Link>
        </div>
      </header>

      {/* Hero section */}
      <section className="mx-auto max-w-6xl px-6 pt-12 pb-8">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-xs font-medium text-emerald-400">
            <Sparkles size={13} />
            <span>Open Opportunities</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
            Explore Open Positions
          </h1>
          <p className="text-base text-slate-400 md:text-lg">
            Discover roles that match your expertise and apply with our streamlined AI-powered application process.
          </p>
        </div>

        {/* Search input */}
        <div className="mt-8 relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <Input
            type="text"
            placeholder="Search by title, skill, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 pl-10 border-slate-800 bg-slate-900/80 text-white placeholder:text-slate-500 focus-visible:ring-emerald-500"
          />
        </div>
      </section>

      {/* Main content */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-3">
            <div className="size-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <p className="text-sm">Loading available opportunities...</p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-900/60 bg-red-950/30 p-5 text-center text-red-300">
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {!loading && !error && filteredJobs.length === 0 && (
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-12 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-800 text-slate-400 mb-3">
              <Building2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-white">No positions found</h3>
            <p className="mt-1 text-sm text-slate-400 max-w-md mx-auto">
              {searchQuery
                ? `No open roles matching "${searchQuery}". Try a different keyword.`
                : "There are no open positions currently available. Please check back soon!"}
            </p>
          </div>
        )}

        {!loading && !error && filteredJobs.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredJobs.map((job) => (
              <Card
                key={job._id}
                className="flex flex-col justify-between border-slate-800/90 bg-slate-900/60 p-6 shadow-sm transition hover:border-emerald-500/40 hover:bg-slate-900/90"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-white hover:text-emerald-400 transition">
                        <Link href={`/jobs/${job._id}`}>{job.title}</Link>
                      </h2>
                      <p className="text-sm text-emerald-400 font-medium mt-0.5">
                        {job.company || "Hiring Organization"}
                      </p>
                    </div>
                    {job.employment_type && (
                      <Badge className="bg-slate-800 text-slate-300 border-slate-700 text-[11px] capitalize">
                        {job.employment_type}
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={13} className="text-slate-500" />
                      {job.location || "Remote"}
                    </span>
                    {job.min_experience !== undefined && (
                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={13} className="text-slate-500" />
                        {job.min_experience}+ yrs exp
                      </span>
                    )}
                    {job.salary_range && (
                      <span>• {job.salary_range}</span>
                    )}
                  </div>

                  <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed">
                    {job.description}
                  </p>

                  {job.required_skills && job.required_skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {job.required_skills.slice(0, 5).map((skill) => (
                        <span
                          key={skill}
                          className="rounded bg-slate-800/80 px-2 py-0.5 text-xs font-medium text-emerald-300 border border-emerald-950"
                        >
                          {skill}
                        </span>
                      ))}
                      {job.required_skills.length > 5 && (
                        <span className="rounded bg-slate-800/50 px-1.5 py-0.5 text-xs text-slate-400">
                          +{job.required_skills.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-800/80 pt-4">
                  <Link
                    href={`/jobs/${job._id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-white transition"
                  >
                    View details
                  </Link>

                  <Link
                    href={`/jobs/${job._id}/apply`}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md bg-emerald-600 px-3.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition"
                  >
                    <span>Apply now</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
