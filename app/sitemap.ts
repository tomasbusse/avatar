import { MetadataRoute } from "next";

const BASE_URL = "https://simmonds.online";

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ["de", "en"];
  const now = new Date();

  const staticPages = [
    { path: "", priority: 1.0, changeFrequency: "weekly" as const },
    { path: "/about", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/pricing", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/faq", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/contact", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/imprint", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/services", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/services/business-english", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/services/team-training", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/services/ai-practice", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/services/german-courses", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/services/copy-editing", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/blog", priority: 0.6, changeFrequency: "weekly" as const },
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const page of staticPages) {
    for (const locale of locales) {
      entries.push({
        url: `${BASE_URL}/${locale}${page.path}`,
        lastModified: now,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: {
          languages: {
            de: `${BASE_URL}/de${page.path}`,
            en: `${BASE_URL}/en${page.path}`,
          },
        },
      });
    }
  }

  return entries;
}
