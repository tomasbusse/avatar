## Tasks

- [ ] Create components/blog/BlogContactCard.tsx as a client component. Display contact info: email james@englisch-lehrer.com, phone +49 511 47 39 339, address Im Werkhof Schaufelder Straße 11 30167 Hannover. Use Mail, Phone, MapPin icons from lucide-react. Add CTA button linking to contact page. Style with bg-sls-teal, white text, rounded-2xl, p-6. Make bilingual using useTranslations hook.

- [ ] Add translations to messages/en.json under "blog" key: contactTitle "Have Questions?", contactSubtitle "Our team is here to help you improve your English", bookConsultation "Book Free Consultation". Add same keys to messages/de.json with German translations.

- [ ] Create components/blog/FloatingContact.tsx as a client component. Fixed position bottom-4 right-4. Default state shows sls-orange circle with MessageCircle icon. On click expands to show three buttons: WhatsApp link, mailto link, tel link. Use useState for expanded state. Add smooth transition animation.

- [ ] Update app/[locale]/blog/[slug]/page.tsx to import and render BlogContactCard at the end of the post content, and FloatingContact component on the page.
