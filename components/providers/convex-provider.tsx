"use client";

import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ReactNode } from "react";

// Lazy initialize Convex client to avoid build-time issues
const getConvexClient = () => {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
  }
  return new ConvexReactClient(url);
};

let convexClient: ConvexReactClient | null = null;
const getClient = () => {
  if (!convexClient) {
    convexClient = getConvexClient();
  }
  return convexClient;
};

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // During build without env vars, show a loading placeholder
  if (!publishableKey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={{
        variables: {
          // SLS Brand Colors
          colorPrimary: "#003F37", // SLS teal
          colorText: "#1A1A1A",
          colorTextSecondary: "#4F5338", // SLS olive
          colorBackground: "#FFFFFF",
          colorInputBackground: "#FFFFFF",
          colorInputText: "#1A1A1A",
          colorDanger: "#B25627", // SLS orange for errors/actions
        },
        elements: {
          // Global element styling with SLS brand
          formButtonPrimary:
            "bg-[#003F37] hover:bg-[#004d42] text-white font-medium",
          card: "border border-[#E3C6AB]",
          headerTitle: "text-[#003F37]",
          headerSubtitle: "text-[#4F5338]",
          socialButtonsBlockButton: "border-[#E3C6AB] hover:bg-[#FFE8CD]",
          footerActionLink: "text-[#B25627] hover:text-[#003F37]",
          formFieldInput: "border-[#E3C6AB] focus:border-[#003F37]",
          formFieldLabel: "text-[#4F5338]",
        },
      }}
    >
      <ConvexProviderWithClerk client={getClient()} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
