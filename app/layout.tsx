import * as Sentry from "@sentry/nextjs";
import type { Metadata } from "next";
import { Blinker, Inter } from "next/font/google";
import { ConvexClientProvider } from "@/components/providers/convex-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "sonner";
import "./globals.css";

// Force dynamic rendering - Convex requires runtime environment variables
export const dynamic = "force-dynamic";

const blinker = Blinker({
  subsets: ["latin"],
  weight: ["200", "300", "400", "600", "700", "800", "900"],
  variable: "--font-blinker",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export function generateMetadata(): Metadata {
  return {
    title: "Beethoven - AI Language Learning",
    description: "Learn languages with AI-powered video avatars",
    other: {
      ...Sentry.getTraceData(),
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${blinker.variable} ${inter.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ConvexClientProvider>
            {children}
            <Toaster position="top-right" theme="light" />
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
