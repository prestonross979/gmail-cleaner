import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { isMockMode } from "@/lib/env";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export default async function DashboardPage() {
  const mockMode = isMockMode();

  if (!mockMode) {
    const session = await auth();
    if (!session || session.error) {
      redirect("/");
    }
  }

  return <DashboardShell mockMode={mockMode} />;
}
