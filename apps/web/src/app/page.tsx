import { DashboardClient } from "./DashboardClient";
import { projectRepository, runRepository } from "@/lib/storage";

export default function HomePage() {
  const projects = projectRepository.list();
  const runs = runRepository.list({ limit: 100 });

  return <DashboardClient projects={projects} runs={runs} />;
}
