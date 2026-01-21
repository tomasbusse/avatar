## Tasks

- [ ] Create components/blog/ReadingProgress.tsx as a client component. Render a fixed top-0 left-0 w-full h-1 bar. Use useEffect with scroll listener to calculate scroll percentage. Fill width with bg-sls-chartreuse based on percentage. Add z-50. Only render on blog post pages.

- [ ] Create lib/utils/reading-time.ts with export function calculateReadingTime(text: string): number that returns minutes based on 200 words per minute average. Update components/landing/BlogCard.tsx to show reading time with Clock icon from lucide-react. Format as "X min read".

- [ ] Create components/blog/ShareButtons.tsx that accepts url, title props. Include share buttons for LinkedIn, Twitter, Facebook, WhatsApp, and a copy link button. Each button should open share URL in new window or copy to clipboard. Style with sls-teal icons, hover:sls-orange. Layout as flex row with gap-2.

- [ ] Create components/blog/TableOfContents.tsx that accepts headings array prop with text and id. Render as nav with ul of anchor links. Style with text-sm, text-sls-olive. Add active state highlighting with text-sls-teal for current section. Use IntersectionObserver to track current section.
