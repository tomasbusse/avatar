"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Sparkles, Send, Loader2, RefreshCw, Edit3, Check, Database, HelpCircle } from "lucide-react";

interface ContactSubmission {
  _id: Id<"contactSubmissions">;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  locale: string;
  status: string;
  repliedAt?: number;
  replySubject?: string;
  replyBody?: string;
  replyMethod?: string;
}

interface AIReplyDialogProps {
  submission: ContactSubmission | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIReplyDialog({ submission, open, onOpenChange }: AIReplyDialogProps) {
  const recordReply = useMutation(api.landing.recordContactReply);
  const knowledgeBases = useQuery(api.knowledgeBases.getActive);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [detectedLanguage, setDetectedLanguage] = useState("en");

  // Knowledge base settings
  const [selectedKnowledgeBases, setSelectedKnowledgeBases] = useState<string[]>([]);
  const [includeFaqs, setIncludeFaqs] = useState(true);
  const [hasKnowledgeContext, setHasKnowledgeContext] = useState(false);

  const handleGenerateReply = async () => {
    if (!submission) return;

    setIsGenerating(true);
    setIsEditing(false);

    try {
      const response = await fetch("/api/email/autoresponder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: submission.name,
          email: submission.email,
          company: submission.company,
          message: submission.message,
          locale: submission.locale,
          mode: "generate",
          knowledgeBaseIds: selectedKnowledgeBases,
          includeFaqs,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate response");
      }

      const data = await response.json();
      setGeneratedEmail(data.generatedEmail);
      setSubject(data.suggestedSubject);
      setDetectedLanguage(data.detectedLanguage);
      setHasKnowledgeContext(data.hasKnowledgeContext);
      toast.success("AI response generated!");
    } catch (error) {
      console.error("Error generating reply:", error);
      toast.error("Failed to generate AI response");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendReply = async () => {
    if (!submission || !generatedEmail || !subject) {
      toast.error("Please generate a response first");
      return;
    }

    setIsSending(true);

    try {
      // Send the email
      const sendResponse = await fetch("/api/email/send-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: submission.email,
          toName: submission.name,
          subject: subject,
          body: generatedEmail,
          locale: detectedLanguage,
          originalMessage: submission.message,
        }),
      });

      if (!sendResponse.ok) {
        throw new Error("Failed to send email");
      }

      // Record the reply in the database
      await recordReply({
        id: submission._id,
        subject: subject,
        body: generatedEmail,
        method: "ai",
      });

      toast.success("Email sent successfully!");
      onOpenChange(false);
      setGeneratedEmail("");
      setSubject("");
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error("Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after a delay to avoid flicker
    setTimeout(() => {
      setGeneratedEmail("");
      setSubject("");
      setIsEditing(false);
      setHasKnowledgeContext(false);
    }, 200);
  };

  const toggleKnowledgeBase = (kbId: string) => {
    setSelectedKnowledgeBases((prev) =>
      prev.includes(kbId)
        ? prev.filter((id) => id !== kbId)
        : [...prev, kbId]
    );
  };

  if (!submission) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            AI Reply to {submission.name}
          </DialogTitle>
          <DialogDescription>
            Generate a personalized reply using Claude Opus 4.5, review, edit, and send.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Original Message */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Original Message</Label>
            <div className="p-4 bg-muted rounded-lg text-sm">
              <div className="flex items-center gap-4 text-muted-foreground mb-2">
                <span className="font-medium text-foreground">{submission.name}</span>
                <span>{submission.email}</span>
                {submission.company && <span>({submission.company})</span>}
              </div>
              <p className="whitespace-pre-wrap">{submission.message}</p>
            </div>
          </div>

          {/* Knowledge Base Selection */}
          <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300">
              <Database className="w-4 h-4" />
              Knowledge Sources
            </div>

            <div className="space-y-2">
              {/* Include FAQs */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-faqs"
                  checked={includeFaqs}
                  onCheckedChange={(checked) => setIncludeFaqs(checked === true)}
                />
                <label
                  htmlFor="include-faqs"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1"
                >
                  <HelpCircle className="w-3 h-3" />
                  Include FAQs from website
                </label>
              </div>

              {/* Knowledge Bases */}
              {knowledgeBases && knowledgeBases.length > 0 && (
                <div className="pt-2 border-t border-blue-200 dark:border-blue-700 mt-2">
                  <p className="text-xs text-muted-foreground mb-2">Additional Knowledge Bases:</p>
                  <div className="space-y-2">
                    {knowledgeBases.map((kb) => (
                      <div key={kb._id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`kb-${kb._id}`}
                          checked={selectedKnowledgeBases.includes(kb._id)}
                          onCheckedChange={() => toggleKnowledgeBase(kb._id)}
                        />
                        <label
                          htmlFor={`kb-${kb._id}`}
                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {kb.name}
                          <span className="text-xs text-muted-foreground ml-2">
                            ({kb.sources?.length || 0} sources)
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!knowledgeBases || knowledgeBases.length === 0) && (
                <p className="text-xs text-muted-foreground">
                  No additional knowledge bases available. FAQs from the website will be used.
                </p>
              )}
            </div>
          </div>

          {/* Generate Button */}
          {!generatedEmail && (
            <div className="flex justify-center py-4">
              <Button
                onClick={handleGenerateReply}
                disabled={isGenerating}
                size="lg"
                className="gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating with Claude Opus 4.5...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate AI Reply
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Generated Response */}
          {generatedEmail && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Generated Response</Label>
                  {hasKnowledgeContext && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Database className="w-3 h-3" />
                      Knowledge-enhanced
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                    className="gap-1"
                  >
                    {isEditing ? (
                      <>
                        <Check className="w-4 h-4" />
                        Done Editing
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-4 h-4" />
                        Edit
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateReply}
                    disabled={isGenerating}
                    className="gap-1"
                  >
                    <RefreshCw className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
                    Regenerate
                  </Button>
                </div>
              </div>

              {/* Subject Line */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Subject</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject..."
                  disabled={!isEditing}
                  className={!isEditing ? "bg-muted" : ""}
                />
              </div>

              {/* Email Body */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Body ({detectedLanguage === "de" ? "German" : "English"})
                </Label>
                {isEditing ? (
                  <Textarea
                    value={generatedEmail}
                    onChange={(e) => setGeneratedEmail(e.target.value)}
                    rows={12}
                    className="font-normal"
                  />
                ) : (
                  <div className="p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap min-h-[200px]">
                    {generatedEmail}
                  </div>
                )}
              </div>

              {/* Send Button */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSendReply}
                  disabled={isSending || !generatedEmail || !subject}
                  className="gap-2"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Email
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Previous Reply Info */}
          {submission.repliedAt && (
            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 mb-2">
                <Check className="w-4 h-4" />
                <span className="font-medium">
                  Previously replied on {new Date(submission.repliedAt).toLocaleDateString()}{" "}
                  via {submission.replyMethod === "ai" ? "AI" : "manual"}
                </span>
              </div>
              {submission.replySubject && (
                <p className="text-xs text-muted-foreground">
                  Subject: {submission.replySubject}
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
