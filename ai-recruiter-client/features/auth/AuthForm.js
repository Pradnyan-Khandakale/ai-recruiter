"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { BriefcaseBusiness, LogIn, UserPlus } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// TODO: Require a valid email and a password of at least 8 characters, with an
// TODO: optional name for signup.
const schema = z.object({}).passthrough();

export function AuthForm({ mode }) {
  const router = useRouter();
  const authenticate = useAuthStore((state) => state.authenticate);
  const loading = useAuthStore((state) => state.loading);
  const { register, handleSubmit, formState: { errors }, setError } = useForm({
    resolver: zodResolver(schema)
  });

  async function onSubmit(values) {
    // TODO: Authenticate through the store, redirect to /dashboard, and set the root
    // TODO: form error when the request fails.
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-md bg-emerald-700 text-white">
            <BriefcaseBusiness size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-950">{mode === "signup" ? "Create recruiter account" : "Recruiter login"}</h1>
            <p className="text-sm text-slate-600">AI Recruitment Agent</p>
          </div>
        </div>

        {mode === "signup" && (
          <label className="mb-4 block text-sm font-semibold text-slate-700">
            Name
            <Input className="mt-1" {...register("name")} />
          </label>
        )}

        <label className="mb-4 block text-sm font-semibold text-slate-700">
          Email
          <Input className="mt-1" type="email" {...register("email")} />
          {errors.email && <span className="text-xs text-red-700">{errors.email.message}</span>}
        </label>

        <label className="mb-4 block text-sm font-semibold text-slate-700">
          Password
          <Input className="mt-1" type="password" {...register("password")} />
          {errors.password && <span className="text-xs text-red-700">{errors.password.message}</span>}
        </label>

        {errors.root && <p className="mb-4 text-sm font-semibold text-red-700">{errors.root.message}</p>}

        <Button className="w-full" disabled={loading}>
          {mode === "signup" ? <UserPlus size={18} /> : <LogIn size={18} />}
          {mode === "signup" ? "Sign up" : "Log in"}
        </Button>
      </form>
    </main>
  );
}
