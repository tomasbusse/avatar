"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2 } from "lucide-react";

interface OnboardingGuardProps {
  children: React.ReactNode;
}

/**
 * Client-side guard that redirects users to onboarding if they haven't completed it.
 * Allows access to onboarding page and admin routes regardless of status.
 */
export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useQuery(api.users.getCurrentUser);
  const student = useQuery(api.students.getStudent);

  // Routes that don't require onboarding completion
  const isOnboardingRoute = pathname?.startsWith("/onboarding");
  const isAdminRoute = pathname?.startsWith("/admin");

  useEffect(() => {
    // Wait for queries to load
    if (user === undefined || student === undefined) return;

    // Allow onboarding and admin routes regardless of status
    if (isOnboardingRoute || isAdminRoute) return;

    // If user exists but no student profile, redirect to onboarding
    if (user && !student) {
      router.replace("/onboarding");
      return;
    }

    // If student exists but onboarding not completed, redirect to onboarding
    if (student && !student.onboardingCompleted) {
      router.replace("/onboarding");
      return;
    }
  }, [user, student, router, isOnboardingRoute, isAdminRoute]);

  // Show loading state while checking
  if (user === undefined || student === undefined) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Allow access to onboarding and admin routes
  if (isOnboardingRoute || isAdminRoute) {
    return <>{children}</>;
  }

  // If no student profile or onboarding not completed, show redirect message
  if (!student || !student.onboardingCompleted) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Redirecting to onboarding...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
