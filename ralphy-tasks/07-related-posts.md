## Tasks

- [ ] Add getRelatedPosts query to convex/landing.ts that accepts postId and categoryId parameters, returns 3 posts from same category excluding current post. If fewer than 3 found, fill with recent posts from other categories.

- [ ] Create components/blog/RelatedPosts.tsx that accepts currentPostId and categoryId props. Use useQuery to fetch related posts. Render heading "Related Articles" and 3-column grid of BlogCard components. Add to bottom of blog post page before contact card.

- [ ] Create components/blog/AuthorBio.tsx that accepts author object with name, bio, imageUrl optional props. Default to James Simmonds with bio "Founder of Simmonds Language Services with over 20 years experience teaching Business English to German professionals." Style with bg-sls-cream rounded-xl p-6, flex layout with avatar and text.

- [ ] Update app/[locale]/blog/[slug]/page.tsx to add AuthorBio component after post content, then RelatedPosts component, then BlogContactCard at the very end. Pass appropriate props to each.
