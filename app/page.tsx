import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mic, Video, Brain, Globe } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">B</span>
            </div>
            <span className="font-semibold text-xl">Beethoven</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-24 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-5xl font-bold tracking-tight mb-6">
              Learn English with{" "}
              <span className="text-primary">AI Avatars</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Practice speaking with photorealistic AI teachers. Available 24/7,
              infinitely patient, and personalized to your learning style.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/sign-up">
                <Button size="lg" className="gap-2">
                  Start Learning Free
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline">
                Watch Demo
              </Button>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Video className="w-6 h-6" />}
              title="Video Avatars"
              description="Photorealistic AI teachers with real-time lip-sync and natural expressions"
            />
            <FeatureCard
              icon={<Mic className="w-6 h-6" />}
              title="Voice Conversation"
              description="Natural spoken conversations with sub-second response times"
            />
            <FeatureCard
              icon={<Globe className="w-6 h-6" />}
              title="Bilingual Support"
              description="Get explanations in German when you need them"
            />
            <FeatureCard
              icon={<Brain className="w-6 h-6" />}
              title="Adaptive Learning"
              description="AI that remembers your progress and adapts to your level"
            />
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="bg-card border border-border rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to start speaking?</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              Join thousands of German speakers improving their English with
              Beethoven. Your first 3 lessons are free.
            </p>
            <Link href="/sign-up">
              <Button size="lg">Create Free Account</Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>&copy; 2025 Beethoven. AI-powered language learning.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-lg border border-border bg-card">
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
