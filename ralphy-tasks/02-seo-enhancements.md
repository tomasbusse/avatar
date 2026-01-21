## Tasks

- [ ] Create lib/seo/structured-data.ts with two exported functions: generateArticleSchema(post) that returns BlogPosting JSON-LD with headline, author, datePublished, dateModified, publisher, and generateOrganizationSchema() that returns Organization JSON-LD for Simmonds Language Services.

- [ ] Update app/[locale]/blog/[slug]/page.tsx generateMetadata to include openGraph with title, description, images array, type "article". Add twitter card metadata. Add article:published_time and article:section from the post data.

- [ ] Create app/sitemap.ts that fetches all published blog posts from Convex and generates sitemap entries for both /en/blog/[slug] and /de/blog/[slug] URLs. Include lastmod from post updatedAt, changefreq weekly, priority 0.7.

- [ ] Create components/blog/BreadcrumbSchema.tsx that generates BreadcrumbList JSON-LD schema. Accept items array prop. Render as script tag with type application/ld+json. Use in blog listing, category pages, and individual posts.
