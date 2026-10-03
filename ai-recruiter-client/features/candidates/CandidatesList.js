"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function CandidatesList() {
  const [candidates, setCandidates] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    // TODO: Load the candidate list from the API and store the error message on failure.
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-950">Candidates</h1>
        <p className="text-slate-600">Applications submitted through public pages.</p>
      </div>
      {error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
      <div className="grid gap-4">
        {candidates.map((candidate) => (
          <Card key={candidate._id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">{candidate.name}</h2>
                <p className="text-sm text-slate-500">{candidate.email} · {candidate.phone}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{candidate.match_score || 0}% match</Badge>
                <Badge>{candidate.status}</Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
