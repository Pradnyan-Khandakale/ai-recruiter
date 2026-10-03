import { cn } from "@/lib/utils";

export function Input(props) {
  return <input className={cn("h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-700", props.className)} {...props} />;
}

export function Textarea(props) {
  return <textarea className={cn("min-h-28 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-700", props.className)} {...props} />;
}
