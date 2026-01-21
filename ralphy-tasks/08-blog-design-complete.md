## Tasks

- [ ] Create components/blog/BlogHero.tsx with a visually striking hero section. Include: gradient background from sls-teal to sls-olive, large headline "Learn English with Interactive Games", subheadline about grammar and business english, two CTA buttons (Browse Articles with sls-orange bg, Free Consultation with outline style linking to /contact), decorative pattern or illustration on the right side, fully responsive. Use Tailwind classes matching the SLS brand.

- [ ] Create components/blog/FeaturedPost.tsx that displays one featured blog post prominently. Include: large image placeholder with gradient overlay, post title in white text over image, category badge, author name and read time, excerpt text, "Read More" button. Style with rounded-2xl, shadow-xl, hover scale effect. Make it link to the blog post.

- [ ] Create components/blog/BlogContactCard.tsx for contact info on blog pages. Include: sls-teal background, white text, headline "Questions? We're Here to Help", email james@englisch-lehrer.com with Mail icon, phone +49 511 47 39 339 with Phone icon, address Im Werkhof Schaufelder Straße 11 30167 Hannover with MapPin icon, CTA button "Book Free Consultation" linking to /contact. Style with rounded-2xl, p-8, flex layout.

- [ ] Create components/blog/GamePreviewCard.tsx to showcase available games on blog. Include: game icon (Gamepad2), game title, difficulty level badge (A1-C2 with colors), short description, "Play Now" button with sls-orange background. Style with bg-white, border-2 border-sls-beige, rounded-xl, hover:border-sls-teal transition.

- [ ] Create components/blog/PopularGamesSection.tsx that shows 3 GamePreviewCard components in a grid. Include section headline "Practice with Interactive Games", subheadline about learning through play. Fetch games from Convex wordGames table using useQuery, limit to 3 featured games. Add "View All Games" link.

- [ ] Update app/[locale]/blog/page.tsx to use the new components. Add BlogHero at the top, then FeaturedPost showing the most recent post, then PopularGamesSection, then the existing CategoryFilterTabs with posts grid, then BlogContactCard at the bottom before CTASection. Fetch featured post separately from other posts.

- [ ] Add translations to i18n/messages/en.json for blog hero: heroHeadline "Learn English with Interactive Games", heroSubheadline "Master grammar and business English through engaging lessons and practice games", browseArticles "Browse Articles", freeConsultation "Free Consultation", featuredPost "Featured Article", popularGames "Practice with Interactive Games", gamesSubheadline "Learn through play with our interactive exercises", viewAllGames "View All Games", contactHeadline "Questions? We're Here to Help".

- [ ] Add the same translations to i18n/messages/de.json in German: heroHeadline "Englisch lernen mit interaktiven Spielen", heroSubheadline "Grammatik und Business-Englisch durch spannende Lektionen und Übungsspiele meistern", browseArticles "Artikel durchsuchen", freeConsultation "Kostenlose Beratung", featuredPost "Empfohlener Artikel", popularGames "Üben mit interaktiven Spielen", gamesSubheadline "Lernen durch Spielen mit unseren interaktiven Übungen", viewAllGames "Alle Spiele ansehen", contactHeadline "Fragen? Wir helfen gerne".

- [ ] Create a seed script at scripts/seed-sample-blog-content.ts that inserts 2 sample blog posts into Convex. Post 1: slug "present-perfect-guide", title "Mastering the Present Perfect Tense", excerpt about when to use present perfect, category "grammar", author "James Simmonds". Post 2: slug "business-email-tips", title "Professional Email Writing Tips", excerpt about formal email language, category "business-english", author "James Simmonds". Include proper blocks array with HeroBlock and RichTextBlock.

- [ ] Run the seed script to add sample content, then run npx convex deploy --yes to push everything to production.
