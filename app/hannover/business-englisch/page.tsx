"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  HeroSection,
  ServicesGrid,
  USPSection,
  TestimonialsCarousel,
  FAQAccordion,
  CTASection,
} from "@/components/landing";

// ============================================
// MAIN PAGE COMPONENT
// Uses the EXACT same components as the home page
// ============================================
export default function BusinessEnglischHannoverPage() {
  // Fetch page data from Convex
  const page = useQuery(api.cityPages.getPublishedBySlug, {
    slug: "hannover/business-englisch",
  });

  // Sort sections by order
  const sortedSections = page?.sections
    ? [...page.sections].sort((a, b) => a.order - b.order)
    : [];

  // Transform section content to component props
  const transformHeroContent = (content: any) => ({
    badge: content?.badge,
    title: content?.title,
    subtitle: content?.subtitle,
    features: content?.features,
    testimonial: content?.testimonial,
    ctaButton: content?.ctaButton,
    ctaButtonSecondary: content?.ctaButtonSecondary,
  });

  const transformServicesContent = (content: any) => ({
    badge: content?.badge,
    title: content?.title,
    subtitle: content?.subtitle,
    items: content?.items?.map((item: any) => ({
      icon: item.icon,
      title: item.title,
      description: item.description,
      href: item.href,
    })),
    showCTA: false, // Don't show "View All Services" link on city pages
  });

  const transformUSPContent = (content: any) => ({
    badge: content?.badge,
    title: content?.title,
    subtitle: content?.subtitle,
    items: content?.items?.map((item: any) => ({
      icon: item.icon,
      title: item.title,
      description: item.description,
    })),
  });

  const transformTestimonialsContent = (content: any) =>
    content?.items?.map((item: any) => ({
      name: item.name,
      company: item.company,
      role: item.role,
      quote: item.quote,
      rating: item.rating,
    }));

  const transformFAQContent = (content: any) =>
    content?.items?.map((item: any) => ({
      question: item.question,
      answer: item.answer,
      category: item.category,
    }));

  const transformCTAContent = (content: any) => ({
    title: content?.title,
    subtitle: content?.subtitle,
    trustBadge: content?.trustBadge,
    buttonPrimary: content?.buttonPrimary,
    buttonSecondary: content?.buttonSecondary,
  });

  // Render section by type using actual landing components
  const renderSection = (section: any) => {
    const content = section.content || {};

    // Check for testimonials first (can be stored as type "content" with id "testimonials")
    if (section.id === "testimonials") {
      return (
        <TestimonialsCarousel
          key={section.id}
          testimonials={transformTestimonialsContent(content)}
        />
      );
    }

    switch (section.type) {
      case "hero":
        return (
          <HeroSection
            key={section.id}
            showAvatar={true}
            content={transformHeroContent(content)}
          />
        );
      case "services":
        return (
          <ServicesGrid
            key={section.id}
            content={transformServicesContent(content)}
          />
        );
      case "features":
        return (
          <USPSection
            key={section.id}
            content={transformUSPContent(content)}
          />
        );
      case "faq":
        return (
          <FAQAccordion
            key={section.id}
            items={transformFAQContent(content)}
            showViewAll={true}
            maxItems={5}
          />
        );
      case "cta":
        return (
          <CTASection
            key={section.id}
            variant="accent"
            content={transformCTAContent(content)}
          />
        );
      case "content":
        // Skip content sections for now - they don't have a landing component equivalent
        return null;
      default:
        return null;
    }
  };

  // If no sections from DB, render default layout with actual landing components
  if (!page?.sections?.length) {
    return (
      <>
        <HeroSection showAvatar={true} />
        <ServicesGrid />
        <USPSection />
        <TestimonialsCarousel />
        <FAQAccordion maxItems={5} showViewAll={true} />
        <CTASection variant="accent" />
      </>
    );
  }

  return <>{sortedSections.map(renderSection)}</>;
}
