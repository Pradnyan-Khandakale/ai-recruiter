import { cn } from "@/lib/utils";

export function Button({ className, variant = "primary", ...props }) {
  const variants = {
    primary: "bg-emerald-700 text-white hover:bg-emerald-800",
    secondary: "bg-slate-900 text-white hover:bg-slate-800",
    outline: "border border-slate-300 bg-white text-slate-900 hover:bg-slate-100",
    ghost: "text-slate-700 hover:bg-slate-100"
  };

  return (
    <button
      className={cn("inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60", variants[variant], className)}
      {...props}
    />
  );
}
