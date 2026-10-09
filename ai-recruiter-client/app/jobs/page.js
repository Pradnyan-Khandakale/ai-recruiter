import { PublicJobsDirectory } from "@/features/jobs/PublicJobsDirectory";

export const metadata = {
  title: "Open Positions | AI Recruiter",
  description: "Browse and apply for open positions with our AI-powered recruitment platform."
};

export default function JobsDirectoryPage() {
  return <PublicJobsDirectory />;
}
