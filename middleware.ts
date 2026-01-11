import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

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
  "/lesson/join/(.*)",  // Lesson preview/join page
  "/lesson/(.*)",       // Lesson session page (supports guest access)
  "/lessons/(.*)",      // Public lesson content viewer
]);

// Public practice routes (guest access via share link)
const isPublicPracticeRoute = createRouteMatcher([
  "/practice/join/(.*)",  // Practice join page (shareable link)
  "/practice/(.*)",       // Practice room (supports guest access)
]);

export default clerkMiddleware(async (auth, req) => {
  // Public lesson routes - skip auth check entirely
  if (isPublicLessonRoute(req)) {
    return;
  }

  // Public practice routes - skip auth check for guest access
  if (isPublicPracticeRoute(req)) {
    return;
  }

  // Protected routes - require authentication
  if (isProtectedRoute(req)) {
    const authObj = await auth();
    if (!authObj.userId) {
      return authObj.redirectToSignIn();
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
