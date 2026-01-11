import { Sidebar } from "@/components/layout/sidebar";
import { OnboardingGuard } from "@/components/auth/onboarding-guard";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <OnboardingGuard>{children}</OnboardingGuard>
      </main>
    </div>
  );
}
