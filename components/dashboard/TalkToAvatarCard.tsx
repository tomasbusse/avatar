"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface TalkToAvatarCardProps {
  avatarName?: string;
  avatarImage?: string;
  greeting?: string;
}

export function TalkToAvatarCard({
  avatarName = "Emma",
  avatarImage,
  greeting = "Ready to practice your English?",
}: TalkToAvatarCardProps) {
  return (
    <Card className="h-full bg-gradient-to-br from-accent/10 to-accent/20 border-accent/30 hover:border-accent/50 transition-colors">
      <CardContent className="p-6 h-full flex flex-col">
        <div className="flex items-start gap-4 mb-4">
          <div className="relative">
            {avatarImage ? (
              <Image
                src={avatarImage}
                alt={avatarName}
                width={56}
                height={56}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-accent/30 flex items-center justify-center">
                <MessageSquare className="w-7 h-7 text-accent-foreground" />
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Talk to {avatarName}
            </p>
            <h3 className="font-semibold text-lg">{greeting}</h3>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-end">
          <p className="text-sm text-muted-foreground mb-4">
            Have a free conversation to practice your speaking skills. {avatarName} will
            help you with pronunciation, vocabulary, and grammar.
          </p>

          <Link href="/lesson/new?mode=conversation" className="block">
            <Button
              variant="secondary"
              className="w-full bg-accent/20 hover:bg-accent/30 text-accent-foreground"
              size="lg"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Start Conversation
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
