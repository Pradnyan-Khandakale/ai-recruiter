import { Suspense } from "react";
import { CandidatesList } from "@/features/candidates/CandidatesList";

export default function CandidatesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500">Loading candidates...</div>}>
      <CandidatesList />
    </Suspense>
  );
}
