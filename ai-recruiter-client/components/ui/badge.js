import { cn } from "@/lib/utils";

export function Badge({ className, ...props }) {
  return <span className={cn("inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700", className)} {...props} />;
}
