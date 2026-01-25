import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { locales, defaultLocale } from "./i18n/config";

// Create next-intl middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: "as-needed", // Only show locale in URL when not default
});

// Routes that always require authentication
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/progress(.*)",
  "/settings(.*)",
  "/onboarding(.*)",
  "/admin(.*)",
]);

// Public lesson routes (open access lessons)
const isPublicLessonRoute = createRouteMatcher([
  "/lesson/join/(.*)",
  "/lesson/(.*)",
  "/lessons/(.*)",
]);

// Public practice routes (guest access via share link)
const isPublicPracticeRoute = createRouteMatcher([
  "/practice/join/(.*)",
  "/practice/(.*)",
]);

// Marketing/landing page routes (public, need i18n)
const isMarketingRoute = createRouteMatcher([
  "/",
  "/de",
  "/en",
  "/de/(.*)",
  "/en/(.*)",
  "/about(.*)",
  "/services(.*)",
  "/pricing(.*)",
  "/faq(.*)",
  "/contact(.*)",
  "/blog(.*)",
]);

// API and special routes that should skip middleware
const isApiRoute = createRouteMatcher([
  "/api/(.*)",
  "/monitoring(.*)",
  "/_next/(.*)",
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Skip API routes entirely
  if (isApiRoute(req)) {
    return NextResponse.next();
  }

  // Marketing routes - apply i18n middleware only
  if (isMarketingRoute(req)) {
    return intlMiddleware(req);
  }

  // Public lesson routes - skip auth check entirely
  if (isPublicLessonRoute(req)) {
    return NextResponse.next();
  }

  // Public practice routes - skip auth check for guest access
  // Also allow embedding in iframes when ?embed=true
  if (isPublicPracticeRoute(req)) {
    const response = NextResponse.next();

    // Check if this is an embed request
    const isEmbed = req.nextUrl.searchParams.get("embed") === "true";

    if (isEmbed) {
      // Allow embedding in any origin (for iframe use)
      response.headers.delete("X-Frame-Options");
      response.headers.set(
        "Content-Security-Policy",
        "frame-ancestors *"
      );
    }

    return response;
  }

  // Protected routes - require authentication
  if (isProtectedRoute(req)) {
    const authObj = await auth();
    if (!authObj.userId) {
      return authObj.redirectToSignIn();
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
