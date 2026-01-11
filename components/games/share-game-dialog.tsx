"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Share2,
  Copy,
  Check,
  Loader2,
  Users,
  Link as LinkIcon,
  QrCode,
  Clock,
  Trash2,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface ShareGameDialogProps {
  gameId: Id<"wordGames">;
  gameTitle: string;
  userId: Id<"users">;
  userDisplayName: string;
  trigger?: React.ReactNode;
}

export function ShareGameDialog({
  gameId,
  gameTitle,
  userId,
  userDisplayName,
  trigger,
}: ShareGameDialogProps) {
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [gameMode, setGameMode] = useState<"collaborative" | "competitive" | "turn_based">("collaborative");
  const [expiresInHours, setExpiresInHours] = useState(24);
  const [allowSelfStart, setAllowSelfStart] = useState(true);
  const [createdSession, setCreatedSession] = useState<{
    shareToken: string;
    shareUrl: string;
    expiresAt: number;
    gameSessionId: Id<"gameSessions">;
  } | null>(null);

  // Get existing active sessions for this game
  const activeSessions = useQuery(api.wordGames.getHostSharedSessions, {
    hostUserId: userId,
  });

  const createShareableSession = useMutation(api.wordGames.createShareableSession);
  const revokeToken = useMutation(api.wordGames.revokeShareToken);
  const endSession = useMutation(api.wordGames.endSharedSession);

  // Filter sessions for this game
  const gameActiveSessions = activeSessions?.filter(
    (s) => s.gameId === gameId
  ) || [];

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const result = await createShareableSession({
        gameId,
        hostUserId: userId,
        hostDisplayName: userDisplayName,
        gameMode,
        expiresInHours,
        allowSelfStart,
      });

      const fullShareUrl = typeof window !== "undefined"
        ? `${window.location.origin}${result.shareUrl}`
        : result.shareUrl;

      setCreatedSession({
        ...result,
        shareUrl: fullShareUrl,
      });
    } catch (error) {
      console.error("Failed to create shareable session:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleEndSession = async (sessionId: Id<"gameSessions">) => {
    try {
      await endSession({
        gameSessionId: sessionId,
        hostUserId: userId,
      });
      if (createdSession?.gameSessionId === sessionId) {
        setCreatedSession(null);
      }
    } catch (error) {
      console.error("Failed to end session:", error);
    }
  };

  const formatExpiry = (timestamp: number) => {
    const now = Date.now();
    const diff = timestamp - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-sls-teal" />
            Share Game
          </DialogTitle>
          <DialogDescription>
            Create a shareable link for &quot;{gameTitle}&quot; to play with others in real-time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Existing active sessions */}
          {gameActiveSessions.length > 0 && !createdSession && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-sls-olive">Active Sessions</h4>
              {gameActiveSessions.map((session) => {
                const sessionUrl = typeof window !== "undefined"
                  ? `${window.location.origin}/games/play/${session.shareToken}`
                  : `/games/play/${session.shareToken}`;

                return (
                  <div
                    key={session._id}
                    className="p-3 bg-gray-50 rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-sls-teal" />
                        <span>{session.activeParticipants} players</span>
                        <span className={`px-1.5 py-0.5 rounded text-xs ${
                          session.status === "waiting"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}>
                          {session.status}
                        </span>
                      </div>
                      {session.tokenExpiresAt && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatExpiry(session.tokenExpiresAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleCopy(sessionUrl)}
                      >
                        {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                        Copy Link
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEndSession(session._id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Created session display */}
          {createdSession ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 mb-3">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Link Created!</span>
                </div>

                <div className="space-y-3">
                  {/* Link display */}
                  <div className="flex gap-2">
                    <Input
                      value={createdSession.shareUrl}
                      readOnly
                      className="text-sm font-mono bg-white"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCopy(createdSession.shareUrl)}
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {/* QR Code toggle */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowQR(!showQR)}
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    {showQR ? "Hide" : "Show"} QR Code
                  </Button>

                  {showQR && (
                    <div className="flex justify-center p-4 bg-white rounded-lg">
                      <QRCodeSVG
                        value={createdSession.shareUrl}
                        size={150}
                        level="M"
                        includeMargin
                      />
                    </div>
                  )}

                  {/* Expiry info */}
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Expires: {new Date(createdSession.expiresAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setCreatedSession(null)}
                >
                  Create New Link
                </Button>
                <Button
                  className="flex-1 bg-sls-teal hover:bg-sls-teal/90"
                  onClick={() => {
                    window.open(createdSession.shareUrl, "_blank");
                  }}
                >
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Open Game
                </Button>
              </div>
            </div>
          ) : (
            /* Create new session form */
            <div className="space-y-4">
              <div>
                <Label htmlFor="gameMode">Game Mode</Label>
                <Select
                  value={gameMode}
                  onValueChange={(v) => setGameMode(v as typeof gameMode)}
                >
                  <SelectTrigger id="gameMode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="collaborative">
                      Collaborative - Work together
                    </SelectItem>
                    <SelectItem value="competitive">
                      Competitive - Race to answer
                    </SelectItem>
                    <SelectItem value="turn_based">
                      Turn-based - Take turns
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="expiry">Link Expires In</Label>
                <Select
                  value={expiresInHours.toString()}
                  onValueChange={(v) => setExpiresInHours(parseInt(v))}
                >
                  <SelectTrigger id="expiry">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="6">6 hours</SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
                    <SelectItem value="72">3 days</SelectItem>
                    <SelectItem value="168">1 week</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allowSelfStart"
                  checked={allowSelfStart}
                  onCheckedChange={(checked) => setAllowSelfStart(checked === true)}
                />
                <label
                  htmlFor="allowSelfStart"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Allow students to start without host
                </label>
              </div>
              <p className="text-xs text-muted-foreground -mt-2 ml-6">
                When enabled, students can begin playing immediately after joining
              </p>

              <Button
                className="w-full bg-sls-teal hover:bg-sls-teal/90"
                onClick={handleCreate}
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Link...
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Create Shareable Link
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ShareGameDialog;
