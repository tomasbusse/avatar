import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/admin/", "/lesson/", "/practice/", "/entry-test/"],
      },
    ],
    sitemap: "https://simmonds.online/sitemap.xml",
  };
}
