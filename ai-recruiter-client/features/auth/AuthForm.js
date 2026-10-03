"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { BriefcaseBusiness, Loader2, LogIn, UserPlus } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z.object({
  name: z.string().optional(),
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

export function AuthForm({ mode }) {
  const router = useRouter();
  const authenticate = useAuthStore((state) => state.authenticate);
  const loading = useAuthStore((state) => state.loading);
  const { register, handleSubmit, formState: { errors }, setError } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: ""
    }
  });

  async function onSubmit(values) {
    if (mode === "signup" && (!values.name || values.name.trim().length < 2)) {
      setError("name", { message: "Name must be at least 2 characters" });
      return;
    }
    try {
      await authenticate(mode, values);
      router.push("/dashboard");
    } catch (err) {
      setError("root", { message: err.message || "Authentication failed" });
    }
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
            <p className="text-sm text-slate-600">AI Recruitment Platform</p>
          </div>
        </div>

        {mode === "signup" && (
          <label className="mb-4 block text-sm font-semibold text-slate-700">
            Name
            <Input className="mt-1" {...register("name")} placeholder="Jane Doe" />
            {errors.name && <span className="text-xs text-red-700">{errors.name.message}</span>}
          </label>
        )}

        <label className="mb-4 block text-sm font-semibold text-slate-700">
          Email
          <Input className="mt-1" type="email" {...register("email")} placeholder="recruiter@example.com" />
          {errors.email && <span className="text-xs text-red-700">{errors.email.message}</span>}
        </label>

        <label className="mb-4 block text-sm font-semibold text-slate-700">
          Password
          <Input className="mt-1" type="password" {...register("password")} placeholder="••••••••" />
          {errors.password && <span className="text-xs text-red-700">{errors.password.message}</span>}
        </label>

        {errors.root && <p className="mb-4 rounded bg-red-50 p-2 text-sm font-semibold text-red-700">{errors.root.message}</p>}

        <Button className="w-full bg-emerald-700 hover:bg-emerald-800" disabled={loading} type="submit">
          {loading ? <Loader2 className="animate-spin" size={18} /> : mode === "signup" ? <UserPlus size={18} /> : <LogIn size={18} />}
          {loading ? "Processing..." : mode === "signup" ? "Sign up" : "Log in"}
        </Button>

        <div className="mt-4 text-center text-sm text-slate-600">
          {mode === "signup" ? (
            <p>Already have an account? <Link href="/login" className="font-semibold text-emerald-700 hover:underline">Log in</Link></p>
          ) : (
            <p>Need a recruiter account? <Link href="/signup" className="font-semibold text-emerald-700 hover:underline">Sign up</Link></p>
          )}
        </div>
      </form>
    </main>
  );
}
