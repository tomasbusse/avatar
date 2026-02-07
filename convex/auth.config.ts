const clerkDomain = process.env.CLERK_JWT_ISSUER_DOMAIN;
if (!clerkDomain) {
  console.warn(
    "[auth.config] CLERK_JWT_ISSUER_DOMAIN is not set. " +
    "Falling back to dev domain. Set this variable in production."
  );
}

export default {
  providers: [
    {
      domain: clerkDomain || "https://diverse-martin-44.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};
