"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { BriefcaseBusiness, Save, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";

const schema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters"),
  description: z.string().trim().min(10, "Description must be at least 10 characters"),
  required_skills: z.string().trim().min(1, "Please specify at least one required skill"),
  preferred_skills: z.string().optional().default(""),
  min_experience: z.coerce.number().min(0, "Minimum experience must be 0 or greater").default(0),
  status: z.enum(["draft", "published", "closed"]).default("published")
});

function splitSkills(value) {
  if (!value || typeof value !== "string") return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function EditJobForm() {
  const router = useRouter();
  const params = useParams();
  const jobId = params?.id;

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
    watch
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      required_skills: "",
      preferred_skills: "",
      min_experience: 0,
      status: "published"
    }
  });

  useEffect(() => {
    if (!jobId) return;
    async function loadJob() {
      try {
        setLoading(true);
        setFetchError("");
        const job = await api.getJob(jobId);
        if (job) {
          reset({
            title: job.title || "",
            description: job.description || "",
            required_skills: Array.isArray(job.required_skills)
              ? job.required_skills.join(", ")
              : "",
            preferred_skills: Array.isArray(job.preferred_skills)
              ? job.preferred_skills.join(", ")
              : "",
            min_experience: job.min_experience || 0,
            status: job.status || "published"
          });
        }
      } catch (err) {
        setFetchError(err?.message || "Failed to load job details");
      } finally {
        setLoading(false);
      }
    }
    loadJob();
  }, [jobId, reset]);

  const requiredSkills = splitSkills(watch("required_skills"));
  const preferredSkills = splitSkills(watch("preferred_skills"));

  async function onSubmit(values) {
    try {
      const payload = {
        title: values.title.trim(),
        description: values.description.trim(),
        required_skills: splitSkills(values.required_skills),
        preferred_skills: splitSkills(values.preferred_skills),
        min_experience: Number(values.min_experience),
        status: values.status
      };

      await api.updateJob(jobId, payload);
      router.push("/dashboard/jobs");
    } catch (err) {
      setError("root", {
        type: "manual",
        message: err?.message || "Failed to update job"
      });
    }
  }

  const rootError = errors.root?.message;
  const firstFieldError = Object.values(errors).find((e) => e?.message)?.message;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <Loader2 className="mr-2 animate-spin" size={20} />
        Loading job details...
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="mx-auto max-w-xl space-y-4 p-6">
        <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {fetchError}
        </p>
        <Link
          href="/dashboard/jobs"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:underline"
        >
          <ArrowLeft size={16} /> Back to jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/jobs"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={16} /> Back to jobs
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-900 p-6 text-white shadow-sm">
        <h1 className="text-3xl font-bold">Edit Job</h1>
        <p className="mt-2 text-sm text-slate-400">
          Update role specifications, requirements, and publishing status.
        </p>
      </div>

      <Card className="border-slate-200 bg-white/95 p-0">
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-0 md:grid-cols-[1fr_280px]">
          <div className="space-y-5 p-5 md:p-6">
            <label className="block text-sm font-semibold text-slate-700">
              Title
              <Input
                className="mt-2 border-slate-200 bg-slate-50 focus:border-teal-600"
                {...register("title")}
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Description
              <Textarea
                rows={4}
                className="mt-2 border-slate-200 bg-slate-50 focus:border-teal-600"
                {...register("description")}
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">
                Required skills (comma-separated)
                <Input
                  className="mt-2 border-slate-200 bg-slate-50 focus:border-teal-600"
                  {...register("required_skills")}
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Preferred skills (comma-separated)
                <Input
                  className="mt-2 border-slate-200 bg-slate-50 focus:border-teal-600"
                  {...register("preferred_skills")}
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">
                Minimum experience (years)
                <Input
                  className="mt-2 border-slate-200 bg-slate-50 focus:border-teal-600"
                  type="number"
                  min="0"
                  {...register("min_experience")}
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Publishing status
                <select
                  className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
                  {...register("status")}
                >
                  <option value="published">Published (Public)</option>
                  <option value="draft">Draft (Private)</option>
                  <option value="closed">Closed</option>
                </select>
              </label>
            </div>

            {(rootError || firstFieldError) && (
              <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                {rootError || firstFieldError}
              </p>
            )}

            <Button
              type="submit"
              className="bg-teal-700 hover:bg-teal-800"
              disabled={isSubmitting}
            >
              <Save size={18} />
              {isSubmitting ? "Updating..." : "Save changes"}
            </Button>
          </div>

          <aside className="border-t border-slate-200 bg-slate-50 p-5 md:border-l md:border-t-0">
            <div className="mb-5 flex items-center gap-2 text-sm font-bold text-slate-900">
              <BriefcaseBusiness size={18} />
              Skill preview
            </div>
            <div className="space-y-5">
              <div>
                <p className="mb-2 text-xs font-bold uppercase text-slate-500">Required</p>
                <div className="flex flex-wrap gap-2">
                  {requiredSkills.length > 0 ? (
                    requiredSkills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">None added</span>
                  )}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold uppercase text-slate-500">Preferred</p>
                <div className="flex flex-wrap gap-2">
                  {preferredSkills.length > 0 ? (
                    preferredSkills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-md bg-cyan-100 px-2.5 py-1 text-xs font-bold text-cyan-800"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">None added</span>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </form>
      </Card>
    </div>
  );
}
