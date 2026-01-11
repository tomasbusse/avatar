"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, Play, Copy, Check, LogOut, Gamepad2, Clock } from "lucide-react";
import { WordGame } from "@/types/word-games";

interface Participant {
  participantId: string;
  displayName: string;
  userId?: Id<"users">;
  joinedAt: number;
  isHost: boolean;
  isActive: boolean;
  lastSeenAt: number;
}

interface GameSession {
  _id: Id<"gameSessions">;
  shareToken?: string;
  hostUserId?: Id<"users">;
  participants?: Participant[];
  status: string;
  sharedState?: {
    gameMode?: string;
    syncedItemIndex?: number;
  };
  allowSelfStart?: boolean;
  tokenExpiresAt?: number;
}

interface GameWaitingRoomProps {
  session: GameSession;
  game: WordGame;
  participantId: string;
  isHost?: boolean;
}

export function GameWaitingRoom({
  session,
  game,
  participantId,
  isHost,
}: GameWaitingRoomProps) {
  const [copied, setCopied] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const startGame = useMutation(api.wordGames.startMultiplayerGame);
  const selfStartGame = useMutation(api.wordGames.selfStartGame);
  const leaveSession = useMutation(api.wordGames.leaveSharedSession);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/games/play/${session.shareToken}`
    : `/games/play/${session.shareToken}`;

  const activeParticipants = session.participants?.filter((p) => p.isActive) || [];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleStartGame = async () => {
    if (!session.hostUserId) return;

    setIsStarting(true);
    try {
      await startGame({
        gameSessionId: session._id,
        hostUserId: session.hostUserId,
      });
    } catch (error) {
      console.error("Failed to start game:", error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleSelfStart = async () => {
    setIsStarting(true);
    try {
      await selfStartGame({
        gameSessionId: session._id,
        participantId,
      });
    } catch (error) {
      console.error("Failed to start game:", error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleLeave = async () => {
    setIsLeaving(true);
    try {
      await leaveSession({
        gameSessionId: session._id,
        participantId,
      });
      // Redirect to home or show a message
      window.location.href = "/";
    } catch (error) {
      console.error("Failed to leave:", error);
    } finally {
      setIsLeaving(false);
    }
  };

  // Calculate time until expiration
  const expiresIn = session.tokenExpiresAt
    ? Math.max(0, Math.floor((session.tokenExpiresAt - Date.now()) / 1000 / 60))
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sls-cream to-white p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="w-20 h-20 rounded-full bg-sls-teal/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Gamepad2 className="w-10 h-10 text-sls-teal" />
          </div>
          <CardTitle className="text-2xl">{game.title}</CardTitle>
          <CardDescription className="space-y-1">
            <p>{game.description || game.instructions}</p>
            <div className="flex items-center justify-center gap-4 mt-2">
              <span className="px-2 py-0.5 bg-sls-chartreuse/20 text-sls-olive rounded-full text-xs">
                {game.level}
              </span>
              <span className="px-2 py-0.5 bg-sls-teal/10 text-sls-teal rounded-full text-xs">
                {session.sharedState?.gameMode || "collaborative"}
              </span>
            </div>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Participants list */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sls-olive flex items-center gap-2">
                <Users className="w-4 h-4" />
                Players ({activeParticipants.length})
              </h3>
              {isHost && (
                <span className="text-xs text-sls-olive">
                  Waiting for players...
                </span>
              )}
            </div>

            <div className="space-y-2">
              {activeParticipants.map((p) => (
                <div
                  key={p.participantId}
                  className={`flex items-center gap-3 p-2 rounded-lg ${
                    p.participantId === participantId
                      ? "bg-sls-teal/10 border border-sls-teal/20"
                      : "bg-gray-50"
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full ${
                    p.isHost ? "bg-sls-chartreuse" : "bg-green-400"
                  }`} />
                  <span className="flex-1 font-medium text-sls-olive">
                    {p.displayName}
                  </span>
                  {p.isHost && (
                    <span className="text-xs text-sls-teal bg-sls-teal/10 px-2 py-0.5 rounded">
                      Host
                    </span>
                  )}
                  {p.participantId === participantId && (
                    <span className="text-xs text-gray-500">
                      (You)
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Share link (host only) */}
          {isHost && (
            <div>
              <h3 className="font-medium text-sls-olive mb-2">Share Link</h3>
              <div className="flex gap-2">
                <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600 truncate font-mono">
                  {shareUrl}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {expiresIn !== null && (
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Link expires in {expiresIn > 60 ? `${Math.floor(expiresIn / 60)}h ${expiresIn % 60}m` : `${expiresIn}m`}
                </p>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleLeave}
              disabled={isLeaving}
            >
              {isLeaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4 mr-2" />
              )}
              Leave
            </Button>

            {isHost && (
              <Button
                className="flex-1 bg-sls-teal hover:bg-sls-teal/90"
                onClick={handleStartGame}
                disabled={isStarting || activeParticipants.length < 1}
              >
                {isStarting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Game
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Waiting message or self-start for non-hosts */}
          {!isHost && (
            session.allowSelfStart ? (
              <Button
                className="w-full bg-sls-teal hover:bg-sls-teal/90"
                onClick={handleSelfStart}
                disabled={isStarting}
              >
                {isStarting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Playing
                  </>
                )}
              </Button>
            ) : (
              <div className="text-center text-sm text-sls-olive bg-gray-50 rounded-lg p-4">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-sls-teal" />
                Waiting for the host to start the game...
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default GameWaitingRoom;
