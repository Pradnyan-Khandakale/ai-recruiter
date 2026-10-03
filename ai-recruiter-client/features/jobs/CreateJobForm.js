"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { BriefcaseBusiness, CheckCircle2, Save, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";

// TODO: Require title (min 2), description (min 10), required_skills, optional
// TODO: preferred_skills, and a coerced min_experience of at least 0.
const schema = z.object({}).passthrough();

function splitSkills(value) {
  // TODO: Split the comma separated value into a trimmed, non-empty skill array.
  return [];
}

export function CreateJobForm() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError, watch } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "Frontend Developer",
      description: "Build production React and Next.js interfaces for hiring products.",
      required_skills: "React, JavaScript, CSS",
      preferred_skills: "Next.js, Tailwind CSS",
      min_experience: 2
    }
  });
  const requiredSkills = splitSkills(watch("required_skills"));
  const preferredSkills = splitSkills(watch("preferred_skills"));

  async function onSubmit(values) {
    // TODO: Create the job with the split skill arrays and the workflow / hiring spec ids,
    // TODO: then redirect to /dashboard/jobs, or set the root form error on failure.
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="overflow-hidden rounded-lg border border-emerald-100 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-md bg-white/15 px-3 py-1 text-sm font-semibold">
              <Sparkles size={16} />
              Hiring workflow builder
            </div>
            <h1 className="text-3xl font-bold">Create job</h1>
            <p className="mt-2 text-sm text-emerald-50">Role details, skill signals, and experience criteria.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {["Parse", "Match", "Approve"].map((step) => (
              <div key={step} className="rounded-md bg-white/15 px-3 py-2">
                <CheckCircle2 className="mx-auto mb-1" size={18} />
                <p className="text-xs font-bold">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Card className="border-slate-200 bg-white/95 p-0">
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-0 md:grid-cols-[1fr_280px]">
          <div className="space-y-5 p-5 md:p-6">
            <label className="block text-sm font-semibold text-slate-700">Title<Input className="mt-2 border-slate-200 bg-slate-50 focus:border-teal-600" {...register("title")} /></label>
            <label className="block text-sm font-semibold text-slate-700">Description<Textarea className="mt-2 border-slate-200 bg-slate-50 focus:border-teal-600" {...register("description")} /></label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">Required skills<Input className="mt-2 border-slate-200 bg-slate-50 focus:border-teal-600" {...register("required_skills")} /></label>
              <label className="block text-sm font-semibold text-slate-700">Preferred skills<Input className="mt-2 border-slate-200 bg-slate-50 focus:border-teal-600" {...register("preferred_skills")} /></label>
            </div>
            <label className="block max-w-xs text-sm font-semibold text-slate-700">Minimum experience<Input className="mt-2 border-slate-200 bg-slate-50 focus:border-teal-600" type="number" {...register("min_experience")} /></label>
            {Object.values(errors)[0] && <p className="text-sm font-semibold text-red-700">{Object.values(errors)[0].message}</p>}
            <Button className="bg-teal-700 hover:bg-teal-800" disabled={isSubmitting}><Save size={18} />{isSubmitting ? "Saving..." : "Save job"}</Button>
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
                  {requiredSkills.map((skill) => <span key={skill} className="rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">{skill}</span>)}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold uppercase text-slate-500">Preferred</p>
                <div className="flex flex-wrap gap-2">
                  {preferredSkills.map((skill) => <span key={skill} className="rounded-md bg-cyan-100 px-2.5 py-1 text-xs font-bold text-cyan-800">{skill}</span>)}
                </div>
              </div>
            </div>
          </aside>
        </form>
      </Card>
    </div>
  );
}
