import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import { MapPin, Clock, Award, Users } from "lucide-react";
import { Breadcrumbs, CTASection, FAQAccordion } from "@/components/landing";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });

  return {
    title: `${t("headline")} | Simmonds Language Services`,
    description: t("subheadline"),
  };
}

export default async function AboutPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "about" });

  return (
    <div className="pt-20">
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: t("headline") }]} />
      </div>

      {/* Header */}
      <section className="py-16 bg-sls-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-2 rounded-full bg-sls-teal/10 text-sls-teal text-sm font-semibold mb-4">
            {t("badge")}
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-sls-teal mb-4">
            {t("headline")}
          </h1>
          <p className="text-xl text-sls-olive/70 max-w-2xl mx-auto">
            {t("subheadline")}
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-sls-teal mb-6">
                {t("storyTitle")}
              </h2>
              <p className="text-lg text-sls-olive/70 leading-relaxed mb-6">
                {t("storyContent")}
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="p-4 rounded-xl bg-sls-cream">
                  <div className="text-3xl font-bold text-sls-teal mb-1">20+</div>
                  <div className="text-sm text-sls-olive">Years Experience</div>
                </div>
                <div className="p-4 rounded-xl bg-sls-cream">
                  <div className="text-3xl font-bold text-sls-teal mb-1">500+</div>
                  <div className="text-sm text-sls-olive">Happy Clients</div>
                </div>
              </div>
            </div>
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-sls-teal to-sls-olive flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-5xl font-bold">JS</span>
                </div>
                <div className="text-xl font-semibold">James Simmonds</div>
                <div className="text-sls-beige/80">Founder & Lead Trainer</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Methodology Section */}
      <section className="py-16 bg-sls-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-sls-chartreuse/20 to-sls-orange/10" />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold text-sls-teal mb-6">
                {t("methodTitle")}
              </h2>
              <p className="text-lg text-sls-olive/70 leading-relaxed mb-6">
                {t("methodContent")}
              </p>
              <ul className="space-y-4">
                {[
                  { icon: <Users />, text: "Tailored to your specific needs" },
                  { icon: <Clock />, text: "Flexible scheduling options" },
                  { icon: <Award />, text: "Proven results over 20 years" },
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-sls-teal/10 flex items-center justify-center text-sls-teal">
                      {item.icon}
                    </div>
                    <span className="text-sls-olive">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Locations */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-sls-teal text-center mb-12">
            {t("locationsTitle")}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: t("hannover"), address: "Im Werkhof, Schaufelder Straße 11" },
              { name: t("berlin"), address: "Friedrichstraße 123" },
              { name: t("online"), address: "Worldwide via Video Call" },
            ].map((location) => (
              <div
                key={location.name}
                className="p-6 rounded-2xl bg-sls-cream border-2 border-sls-beige hover:border-sls-teal/30 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-sls-teal/10 flex items-center justify-center text-sls-teal mb-4">
                  <MapPin className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-sls-teal mb-2">
                  {location.name}
                </h3>
                <p className="text-sls-olive/70">{location.address}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQAccordion maxItems={3} showViewAll={true} />

      {/* CTA */}
      <CTASection variant="accent" />
    </div>
  );
}
