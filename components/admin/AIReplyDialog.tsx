"use client";

import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Sparkles,
  Send,
  Loader2,
  RefreshCw,
  Edit3,
  Check,
  Database,
  HelpCircle,
  PenLine,
  Settings2,
  ChevronDown,
  ChevronUp,
  Cog,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

type ReplyMode = "ai" | "manual";

const DEFAULT_AI_PROMPT = `You are James Simmonds, the founder of Simmonds Language Services (SLS). Write personalized, professional yet warm email responses. Be helpful and direct, never salesy. Match the language of the inquiry (German or English). Reference specific details from their message. Keep it concise (2-4 short paragraphs).`;

export function AIReplyDialog({ submission, open, onOpenChange }: AIReplyDialogProps) {
  const recordReply = useMutation(api.landing.recordContactReply);
  const knowledgeBases = useQuery(api.knowledgeBases.getActive);
  const emailConfig = useQuery(api.landing.getEmailConfig);

  // Track if settings have been customized
  const [usingGlobalDefaults, setUsingGlobalDefaults] = useState(true);
  const [configInitialized, setConfigInitialized] = useState(false);

  // Mode selection - initialize from global config
  const [replyMode, setReplyMode] = useState<ReplyMode>("ai");

  // Common state
  const [isSending, setIsSending] = useState(false);
  const [subject, setSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [detectedLanguage, setDetectedLanguage] = useState("en");

  // AI mode state
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasKnowledgeContext, setHasKnowledgeContext] = useState(false);
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [customPrompt, setCustomPrompt] = useState(DEFAULT_AI_PROMPT);

  // Knowledge base settings
  const [selectedKnowledgeBases, setSelectedKnowledgeBases] = useState<string[]>([]);
  const [includeFaqs, setIncludeFaqs] = useState(true);
  const [includeServices, setIncludeServices] = useState(true);

  // Initialize settings from global config when it loads
  useEffect(() => {
    if (emailConfig && !configInitialized) {
      // Set reply mode from global config
      const configReplyMode = emailConfig.replyMode;
      if (configReplyMode === "manual" || configReplyMode === "disabled") {
        setReplyMode("manual");
      } else {
        setReplyMode("ai");
      }

      // Set AI settings
      if (emailConfig.aiSettings?.customPrompt) {
        setCustomPrompt(emailConfig.aiSettings.customPrompt);
      }

      // Set knowledge base settings
      setIncludeFaqs(emailConfig.knowledgeBase?.includeFaqs ?? true);
      setIncludeServices(emailConfig.knowledgeBase?.includeServices ?? true);
      if (emailConfig.knowledgeBase?.defaultKnowledgeBaseIds) {
        setSelectedKnowledgeBases(emailConfig.knowledgeBase.defaultKnowledgeBaseIds);
      }

      setConfigInitialized(true);
    }
  }, [emailConfig, configInitialized]);

  const handleGenerateReply = async () => {
    if (!submission) return;

    setIsGenerating(true);

    try {
      // Determine if we should send custom prompt or let API use global config
      const globalPrompt = emailConfig?.aiSettings?.customPrompt;
      const isCustomPrompt = customPrompt !== DEFAULT_AI_PROMPT && customPrompt !== globalPrompt;

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
          knowledgeBaseIds: selectedKnowledgeBases.length > 0 ? selectedKnowledgeBases : undefined,
          includeFaqs,
          includeServices,
          customPrompt: isCustomPrompt ? customPrompt : undefined,
          useGlobalConfig: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate response");
      }

      const data = await response.json();
      setEmailBody(data.generatedEmail);
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
    if (!submission || !emailBody || !subject) {
      toast.error("Please fill in subject and message");
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
          body: emailBody,
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
        body: emailBody,
        method: replyMode,
      });

      toast.success("Email sent successfully!");
      onOpenChange(false);
      resetState();
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error("Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  const resetState = () => {
    setEmailBody("");
    setSubject("");
    setHasKnowledgeContext(false);
    setDetectedLanguage("en");
    setConfigInitialized(false);
    setUsingGlobalDefaults(true);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(resetState, 200);
  };

  // Track when user customizes settings
  const markAsCustomized = () => {
    setUsingGlobalDefaults(false);
  };

  const handleModeChange = (mode: ReplyMode) => {
    setReplyMode(mode);
    // Reset email content when switching modes
    resetState();
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
            {replyMode === "ai" ? (
              <Sparkles className="w-5 h-5 text-amber-500" />
            ) : (
              <PenLine className="w-5 h-5 text-blue-500" />
            )}
            Reply to {submission.name}
          </DialogTitle>
          <DialogDescription>
            {replyMode === "ai"
              ? "Generate a personalized reply using Claude Opus 4.5, review, edit, and send."
              : "Write and send a manual reply."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Mode Toggle */}
          <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
            <Button
              variant={replyMode === "ai" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleModeChange("ai")}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              AI Reply
            </Button>
            <Button
              variant={replyMode === "manual" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleModeChange("manual")}
              className="gap-2"
            >
              <PenLine className="w-4 h-4" />
              Manual Reply
            </Button>
          </div>

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

          {/* AI Mode Settings */}
          {replyMode === "ai" && (
            <>
              {/* Global Config Indicator */}
              {usingGlobalDefaults && emailConfig && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
                  <Cog className="w-4 h-4" />
                  <span>Using default settings from Email Configuration</span>
                  <Badge variant="secondary" className="text-xs">Global</Badge>
                </div>
              )}

              {/* Knowledge Base Selection */}
              <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300">
                  <Database className="w-4 h-4" />
                  Knowledge Sources
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-faqs"
                      checked={includeFaqs}
                      onCheckedChange={(checked) => {
                        setIncludeFaqs(checked === true);
                        markAsCustomized();
                      }}
                    />
                    <label
                      htmlFor="include-faqs"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1"
                    >
                      <HelpCircle className="w-3 h-3" />
                      Include FAQs from website
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-services"
                      checked={includeServices}
                      onCheckedChange={(checked) => {
                        setIncludeServices(checked === true);
                        markAsCustomized();
                      }}
                    />
                    <label
                      htmlFor="include-services"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1"
                    >
                      <Database className="w-3 h-3" />
                      Include Services info
                    </label>
                  </div>

                  {knowledgeBases && knowledgeBases.length > 0 && (
                    <div className="pt-2 border-t border-blue-200 dark:border-blue-700 mt-2">
                      <p className="text-xs text-muted-foreground mb-2">Additional Knowledge Bases:</p>
                      <div className="space-y-2">
                        {knowledgeBases.map((kb) => (
                          <div key={kb._id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`kb-${kb._id}`}
                              checked={selectedKnowledgeBases.includes(kb._id)}
                              onCheckedChange={() => {
                                toggleKnowledgeBase(kb._id);
                                markAsCustomized();
                              }}
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

              {/* AI Prompt Settings (Collapsible) */}
              <div className="border rounded-lg">
                <button
                  type="button"
                  onClick={() => setShowAiSettings(!showAiSettings)}
                  className="w-full flex items-center justify-between p-3 text-sm font-medium hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Settings2 className="w-4 h-4" />
                    AI Prompt Settings
                  </div>
                  {showAiSettings ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {showAiSettings && (
                  <div className="p-4 border-t space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        Custom AI Instructions (persona, tone, style)
                      </Label>
                      <Textarea
                        value={customPrompt}
                        onChange={(e) => {
                          setCustomPrompt(e.target.value);
                          markAsCustomized();
                        }}
                        rows={6}
                        placeholder="Enter custom instructions for the AI..."
                        className="text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Reset to global config prompt if available, otherwise default
                          const globalPrompt = emailConfig?.aiSettings?.customPrompt;
                          setCustomPrompt(globalPrompt || DEFAULT_AI_PROMPT);
                          setUsingGlobalDefaults(true);
                        }}
                      >
                        Reset to Global Default
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Generate Button */}
              {!emailBody && (
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
            </>
          )}

          {/* Email Composer (shown for manual mode OR after AI generation) */}
          {(replyMode === "manual" || emailBody) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">
                    {replyMode === "ai" ? "Generated Response" : "Your Reply"}
                  </Label>
                  {replyMode === "ai" && hasKnowledgeContext && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Database className="w-3 h-3" />
                      Knowledge-enhanced
                    </span>
                  )}
                </div>
                {replyMode === "ai" && emailBody && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateReply}
                    disabled={isGenerating}
                    className="gap-1"
                  >
                    <RefreshCw className={cn("w-4 h-4", isGenerating && "animate-spin")} />
                    Regenerate
                  </Button>
                )}
              </div>

              {/* Subject Line */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Subject</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject..."
                />
              </div>

              {/* Email Body */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Body {detectedLanguage && replyMode === "ai" && `(${detectedLanguage === "de" ? "German" : "English"})`}
                </Label>
                <Textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={12}
                  placeholder={replyMode === "manual" ? "Write your reply here..." : ""}
                  className="font-normal"
                />
              </div>

              {/* Send Button */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSendReply}
                  disabled={isSending || !emailBody || !subject}
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
