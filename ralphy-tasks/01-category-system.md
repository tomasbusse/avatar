## Tasks

- [x] Add blogCategories table to convex/schema.ts with fields: slug (string), name (object with en and de string properties), description (object with en and de string properties), icon (string), color (string), order (number). Also add optional categoryId field to the existing blogPosts table.

- [x] Create convex/blogCategories.ts with queries and mutations: list (returns all categories sorted by order), getBySlug (returns single category), create, update, delete. Export them properly.

- [x] Create app/[locale]/blog/category/[slug]/page.tsx that fetches the category by slug and displays its posts. Include generateMetadata for SEO with title and description from category. Add Breadcrumbs showing Home > Blog > Category Name. Use the existing BlogCard component for the post grid.

- [x] Update app/[locale]/blog/page.tsx to add category filter tabs. Fetch all categories and display as horizontal tabs above the blog grid. Include an "All" tab. Style active tab with bg-sls-teal text-white, inactive with bg-sls-beige/50. Filter posts when tab is clicked.
