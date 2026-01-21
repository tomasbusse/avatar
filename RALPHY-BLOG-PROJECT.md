# Blog Enhancement Project for Simmonds Language Services

Build a modern, SEO-optimized educational blog with categories, interactive games, and consistent branding.

## Design Requirements

- Use SLS brand colors: teal (#003F37), olive (#4F5338), chartreuse (#9F9D38), orange (#B25627), beige (#E3C6AB), cream (#FFE8CD)
- Modern, clean design matching existing game components style
- Mobile-first responsive design
- Support German/English (i18n with next-intl)
- Include contact details on every blog page: james@englisch-lehrer.com, +49 511 47 39 339, Im Werkhof, Schaufelder Straße 11, 30167 Hannover

## Contact Info Component for Blog

- Create a reusable BlogContactCard component at components/blog/BlogContactCard.tsx
- Include email, phone, address with icons (Mail, Phone, MapPin from lucide-react)
- Add CTA button "Book a Free Consultation" linking to /contact
- Style with sls-teal background, cream text, rounded-2xl
- Make it bilingual (German/English)

---

## Phase 1: Category System

### 1.1 Add category schema to Convex
- Update convex/schema.ts to add a blogCategories table with: id, slug, name (en/de), description (en/de), icon, color, order
- Add categoryId field to blogPosts table
- Create convex/blogCategories.ts with CRUD functions

### 1.2 Create category page route
- Create app/[locale]/blog/category/[slug]/page.tsx
- Fetch posts filtered by category
- Add SEO metadata for category pages
- Include breadcrumbs: Home > Blog > [Category Name]

### 1.3 Add category filter to blog listing
- Update app/[locale]/blog/page.tsx with horizontal category tabs
- Add "All" option plus each category
- Style tabs with sls-teal active state, sls-beige inactive
- Make it sticky on scroll

### 1.4 Create category cards for blog homepage
- Add featured categories section above blog grid
- Show category icon, name, post count
- Link to category page
- Animate on hover with scale and shadow

---

## Phase 2: SEO Enhancements

### 2.1 Add JSON-LD structured data
- Create lib/seo/structured-data.ts with Article, BlogPosting, Organization schemas
- Add FAQ schema support for posts with FAQ blocks
- Include author, datePublished, dateModified, publisher

### 2.2 Enhance blog post metadata
- Update app/[locale]/blog/[slug]/page.tsx generateMetadata
- Add Open Graph image generation
- Add Twitter card metadata
- Add canonical URLs
- Add article:published_time, article:modified_time, article:section

### 2.3 Create XML sitemap for blog
- Create app/sitemap.ts with blog posts
- Include all categories
- Add lastmod, changefreq, priority
- Handle both locales (en/de)

### 2.4 Add breadcrumb structured data
- Create BreadcrumbList JSON-LD for all blog pages
- Include in blog listing, category pages, and individual posts

---

## Phase 3: Grammar Points Category Content

### 3.1 Seed grammar categories in Convex
- Create category: "Grammar" with slug "grammar", icon "BookOpen", color "sls-teal"
- Create subcategories: Tenses, Articles, Prepositions, Conditionals, Modal Verbs

### 3.2 Create grammar blog post template
- Build a reusable structure: Hero > Explanation > Example > Game > Practice > Contact
- Include level indicator (A1-C2)
- Add "Common Mistakes" callout block

### 3.3 Create sample grammar posts with games
Using the BlockEditor, create these posts:

**Post 1: Present Perfect vs Simple Past**
- Category: Grammar > Tenses
- Level: B1
- Blocks: Hero, RichText explanation, Example sentences, Embedded fill-in-blank game, FAQ block, ContactCard
- SEO focus: "present perfect vs simple past german speakers"

**Post 2: Articles in English (a/an/the)**
- Category: Grammar > Articles
- Level: A2
- Blocks: Hero, RichText with rules, Image examples, Multiple-choice game, Common mistakes callout, ContactCard
- SEO focus: "english articles for german speakers"

**Post 3: Prepositions of Time (in/on/at)**
- Category: Grammar > Prepositions
- Level: A2-B1
- Blocks: Hero, Visual diagram, Matching pairs game, Practice sentences, ContactCard
- SEO focus: "prepositions of time english"

---

## Phase 4: Business English Category Content

### 4.1 Seed business english categories
- Create category: "Business English" with slug "business-english", icon "Briefcase", color "sls-olive"
- Subcategories: Meetings, Emails, Presentations, Negotiations, Small Talk

### 4.2 Create business english blog post template
- Structure: Hero > Context > Key Phrases > Dialogue Example > Game > Download Resources > Contact
- Include industry relevance tags
- Add "Pro Tip" callout blocks

### 4.3 Create sample business english posts with games

**Post 1: Email Writing: Professional Openings & Closings**
- Category: Business English > Emails
- Level: B1-B2
- Blocks: Hero, Formal vs Informal comparison, Vocabulary matching game, Template downloads, ContactCard
- SEO focus: "professional email english business"

**Post 2: Small Talk at Conferences**
- Category: Business English > Small Talk
- Level: B2
- Blocks: Hero, Conversation starters list, Sentence builder game, Cultural tips callout, ContactCard
- SEO focus: "business small talk english phrases"

**Post 3: Presenting Data and Graphs**
- Category: Business English > Presentations
- Level: B2-C1
- Blocks: Hero, Key phrases, Image examples of graphs, Fill-in-blank game, ContactCard
- SEO focus: "presenting data english business"

---

## Phase 5: Design Polish

### 5.1 Add reading progress indicator
- Create components/blog/ReadingProgress.tsx
- Thin progress bar at top of page
- Color: sls-chartreuse
- Animate smoothly on scroll

### 5.2 Add estimated reading time
- Calculate from word count in blog posts
- Display with Clock icon
- Format: "5 min read" / "5 Min. Lesezeit"

### 5.3 Add social share buttons
- Create components/blog/ShareButtons.tsx
- Include: LinkedIn, Twitter/X, Facebook, Copy Link, WhatsApp
- Floating sidebar on desktop, bottom bar on mobile
- Track shares for analytics

### 5.4 Add related posts section
- Show 3 related posts at bottom
- Match by category first, then tags
- Card design with image, title, category badge, read time

### 5.5 Add author bio section
- Create components/blog/AuthorBio.tsx
- Show author photo, name, bio, social links
- Style with sls-cream background, rounded card

### 5.6 Add table of contents
- Generate from H2/H3 headings in RichText blocks
- Sticky sidebar on desktop
- Collapsible on mobile
- Highlight current section on scroll

---

## Phase 6: Interactive Game Integration

### 6.1 Create grammar-specific games
- Create 3 vocabulary matching games for grammar topics
- Create 3 fill-in-blank games for tenses
- Create 2 sentence builder games for word order
- Store in Convex wordGames table with appropriate category tags

### 6.2 Create business english games
- Create 3 matching games for business vocabulary
- Create 2 multiple choice games for email phrases
- Create 2 word scramble games for presentations vocabulary

### 6.3 Add game completion tracking
- Show completion status on blog posts
- Encourage login to save progress
- Display achievement badges

---

## Phase 7: Contact Integration

### 7.1 Add contact CTA to every blog post
- Insert BlogContactCard component at end of every post
- Bilingual text: "Questions about this topic? We're here to help!"
- Include quick contact options: Email, Phone, Book Consultation

### 7.2 Add floating contact button
- Fixed position button on blog pages
- Expands to show contact options
- WhatsApp, Email, Phone icons
- sls-orange background

### 7.3 Add newsletter signup
- Create components/blog/NewsletterSignup.tsx
- Collect email, preferred topics (Grammar, Business, Both)
- Integrate with email service
- Show inline in blog posts and at footer

---

## Testing Checklist

- [ ] All blog pages load without errors
- [ ] Category filtering works correctly
- [ ] Games embed and play correctly in posts
- [ ] SEO metadata renders correctly (check with browser dev tools)
- [ ] Structured data validates (test with Google Rich Results)
- [ ] Mobile responsive on all screen sizes
- [ ] German/English switching works
- [ ] Contact info displays correctly
- [ ] Social sharing works
- [ ] Reading progress indicator works
- [ ] Build completes without errors: npm run build
- [ ] Lint passes: npm run lint
