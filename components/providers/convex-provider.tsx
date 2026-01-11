"use client";

import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ReactNode } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
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
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
