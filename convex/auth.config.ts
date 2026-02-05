export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN || "https://diverse-martin-44.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
};
