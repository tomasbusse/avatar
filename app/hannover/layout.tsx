import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Header, Footer } from "@/components/landing";

interface HannoverLayoutProps {
  children: React.ReactNode;
}

export default async function HannoverLayout({ children }: HannoverLayoutProps) {
  // Default to German for Hannover pages
  const messages = await getMessages({ locale: "de" });

  return (
    <NextIntlClientProvider locale="de" messages={messages}>
      <div className="flex flex-col min-h-screen bg-sls-cream text-sls-teal antialiased">
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
      </div>
    </NextIntlClientProvider>
  );
}
