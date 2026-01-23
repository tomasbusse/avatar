"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ContactForm } from "@/components/landing/ContactForm";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ContactDialogProps {
  triggerClassName?: string;
  triggerText?: string;
  children?: React.ReactNode;
}

export function ContactDialog({
  triggerClassName,
  triggerText = "Free Consultation",
  children,
}: ContactDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? (
        <button onClick={() => setOpen(true)} className={triggerClassName}>
          {children}
        </button>
      ) : (
        <Button
          onClick={() => setOpen(true)}
          variant="outline"
          size="lg"
          className={cn(
            "border-2 border-white/30 bg-white/5 backdrop-blur-sm text-white hover:bg-white/10 hover:border-white/50 font-semibold px-8 py-6 text-base rounded-lg transition-all hover:-translate-y-0.5",
            triggerClassName
          )}
        >
          <MessageCircle className="mr-2 h-5 w-5" />
          {triggerText}
        </Button>
      )}
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-sls-teal">
            Get in Touch
          </DialogTitle>
          <DialogDescription className="text-sls-olive">
            Send us a message and we&apos;ll get back to you within 24 hours.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <ContactForm source="blog_popup" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
