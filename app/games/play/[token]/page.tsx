"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, Play, Clock, AlertCircle, Gamepad2 } from "lucide-react";
import { GameViewer } from "@/components/games/game-viewer";
import { GameWaitingRoom } from "@/components/games/game-waiting-room";
import { PlayerCursors, PlayerList, PlayerInputs, ControlPanel } from "@/components/games/player-cursors";

export default function GamePlayPage() {
  const params = useParams();
  const token = params.token as string;

  const [displayName, setDisplayName] = useState("");
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const gameContainerRef = useRef<HTMLDivElement>(null);

  // Fetch session by token
  const sessionResult = useQuery(api.wordGames.getSessionByToken, { shareToken: token });

  // Mutations
  const joinSession = useMutation(api.wordGames.joinSharedSession);
  const updatePresence = useMutation(api.wordGames.updateParticipantPresence);
  const updateGameState = useMutation(api.wordGames.updateSharedGameState);
  const updatePlayerInput = useMutation(api.wordGames.updatePlayerInput);
  const updateElementPositions = useMutation(api.wordGames.updateElementPositions);
  const updateCrosswordGrid = useMutation(api.wordGames.updateCrosswordGrid);

  // Keep presence alive
  useEffect(() => {
    if (!participantId || !sessionResult?.session?._id) return;

    const interval = setInterval(() => {
      updatePresence({
        gameSessionId: sessionResult.session._id,
        participantId,
      });
    }, 15000); // Every 15 seconds

    return () => clearInterval(interval);
  }, [participantId, sessionResult?.session?._id, updatePresence]);

  // Sync currentIndex with sharedState
  useEffect(() => {
    if (sessionResult?.session?.sharedState?.syncedItemIndex !== undefined) {
      setCurrentIndex(sessionResult.session.sharedState.syncedItemIndex);
    }
  }, [sessionResult?.session?.sharedState?.syncedItemIndex]);

  // Handle join
  const handleJoin = async () => {
    if (!displayName.trim()) return;

    setIsJoining(true);
    try {
      const result = await joinSession({
        shareToken: token,
        displayName: displayName.trim(),
      });
      setParticipantId(result.participantId);
    } catch (error) {
      console.error("Failed to join:", error);
    } finally {
      setIsJoining(false);
    }
  };

  // Handle game completion
  const handleComplete = (result: {
    isCorrect: boolean;
    attempts: number;
    hintsUsed: number;
    timeSeconds: number;
    itemIndex: number;
  }) => {
    console.log("Item completed:", result);
  };

  const handleGameComplete = (finalScore: {
    stars: number;
    scorePercent: number;
    totalCorrect: number;
    totalItems: number;
  }) => {
    console.log("Game completed:", finalScore);
  };

  // Sync input changes to other players
  const handleInputChange = useCallback(
    (value: string) => {
      if (!participantId || !sessionResult?.session?._id) return;
      updatePlayerInput({
        gameSessionId: sessionResult.session._id,
        participantId,
        value,
        itemIndex: currentIndex,
      });
    },
    [participantId, sessionResult?.session?._id, currentIndex, updatePlayerInput]
  );

  // Sync element changes (blocks, words, etc.) to other players
  const handleElementsChange = useCallback(
    (elementIds: string[]) => {
      if (!participantId || !sessionResult?.session?._id) return;
      updateElementPositions({
        gameSessionId: sessionResult.session._id,
        participantId,
        itemIndex: currentIndex,
        positions: elementIds.map((id, index) => ({
          id,
          x: 0,
          y: 0,
          slot: index,
        })),
      });
    },
    [participantId, sessionResult?.session?._id, currentIndex, updateElementPositions]
  );

  // Sync crossword grid changes to other players
  const handleCrosswordChange = useCallback(
    (gridState: string) => {
      if (!participantId || !sessionResult?.session?._id) return;
      updateCrosswordGrid({
        gameSessionId: sessionResult.session._id,
        participantId,
        itemIndex: currentIndex,
        gridState,
      });
    },
    [participantId, sessionResult?.session?._id, currentIndex, updateCrosswordGrid]
  );

  // Loading state
  if (sessionResult === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sls-cream to-white">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-sls-teal mx-auto mb-4" />
          <p className="text-sls-olive">Loading game session...</p>
        </div>
      </div>
    );
  }

  // Error states
  if (sessionResult === null || sessionResult.error === "expired") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sls-cream to-white p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-red-500" />
            </div>
            <CardTitle>Session Expired</CardTitle>
            <CardDescription>
              This game session link has expired or is no longer valid.
              Please ask the host for a new link.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (sessionResult.error === "ended") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sls-cream to-white p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-gray-500" />
            </div>
            <CardTitle>Session Ended</CardTitle>
            <CardDescription>
              This game session has already ended.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const session = sessionResult.session;
  if (!session || !session.game) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sls-cream to-white p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <CardTitle>Session Not Found</CardTitle>
            <CardDescription>
              This game session could not be found. Please check the link and try again.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Show join form if not joined yet
  if (!participantId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sls-cream to-white p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-sls-teal/10 flex items-center justify-center mx-auto mb-4">
              <Gamepad2 className="w-8 h-8 text-sls-teal" />
            </div>
            <CardTitle>{session.game.title}</CardTitle>
            <CardDescription className="space-y-2">
              <p>{session.game.description || session.game.instructions}</p>
              <div className="flex items-center justify-center gap-4 text-sm mt-4">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {session.participants?.filter((p: { isActive: boolean }) => p.isActive).length || 0} waiting
                </span>
                <span className="px-2 py-0.5 bg-sls-chartreuse/20 text-sls-olive rounded-full text-xs">
                  {session.game.level}
                </span>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-sls-olive mb-1">
                Your Name
              </label>
              <Input
                id="displayName"
                placeholder="Enter your name..."
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                disabled={isJoining}
              />
            </div>
            <Button
              className="w-full bg-sls-teal hover:bg-sls-teal/90"
              onClick={handleJoin}
              disabled={!displayName.trim() || isJoining}
            >
              {isJoining ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Join Game
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show waiting room if game hasn't started
  if (session.status === "waiting") {
    return (
      <GameWaitingRoom
        session={session}
        game={session.game}
        participantId={participantId}
        isHost={session.participants?.find(
          (p: { participantId: string }) => p.participantId === participantId
        )?.isHost}
      />
    );
  }

  // Check if current user has control
  const isHost = session.participants?.find(
    (p: { participantId: string; isHost: boolean }) =>
      p.participantId === participantId && p.isHost
  );
  const controlMode = session.sharedState?.controlMode || "free";
  const controlledBy = session.sharedState?.controlledBy;

  const hasControl =
    controlMode === "free" ||
    (controlMode === "host_only" && isHost) ||
    (controlMode === "single" && controlledBy === participantId);

  // Game is in progress - show the game viewer
  return (
    <div className="min-h-screen bg-gradient-to-br from-sls-cream to-white">
      {/* Header with participants */}
      <div className="bg-white border-b border-gray-100 px-4 py-2">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-sls-teal" />
            <span className="font-medium text-sls-teal">{session.game.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-sls-olive" />
            <span className="text-sm text-sls-olive">
              {session.participants?.filter((p: { isActive: boolean }) => p.isActive).length || 0} playing
            </span>
          </div>
        </div>
      </div>

      {/* Game Content */}
      <div className="max-w-4xl mx-auto p-4">
        <div ref={gameContainerRef} className="relative">
          <Card className="overflow-hidden relative">
            <GameViewer
              game={session.game}
              currentIndex={currentIndex}
              onIndexChange={setCurrentIndex}
              onComplete={handleComplete}
              onGameComplete={handleGameComplete}
              onInputChange={handleInputChange}
              onElementsChange={handleElementsChange}
              syncedElements={
                session.sharedState?.elements?.itemIndex === currentIndex
                  ? session.sharedState.elements.positions.map((p: { id: string }) => p.id)
                  : undefined
              }
              onCrosswordChange={handleCrosswordChange}
              syncedCrosswordGrid={
                session.sharedState?.crosswordGrid?.itemIndex === currentIndex
                  ? session.sharedState.crosswordGrid.gridState
                  : undefined
              }
              navigationDisabled={!isHost}
              interactionDisabled={!hasControl}
            />
            {/* Show what other players are typing */}
            {participantId && session.participants && (
              <div className="px-4 pb-4">
                <PlayerInputs
                  participants={session.participants}
                  currentParticipantId={participantId}
                  currentItemIndex={currentIndex}
                  inputs={session.sharedState?.inputs}
                />
              </div>
            )}
            {/* Overlay when user doesn't have control */}
            {!hasControl && (
              <div className="absolute inset-0 bg-gray-100/50 flex items-center justify-center pointer-events-none z-40">
                <div className="bg-white px-4 py-2 rounded-lg shadow-lg text-sm text-gray-600">
                  {controlMode === "host_only" && "Host is controlling"}
                  {controlMode === "single" && controlledBy && (
                    <>
                      {session.participants?.find(
                        (p: { participantId: string }) => p.participantId === controlledBy
                      )?.displayName || "Someone"}{" "}
                      is controlling
                    </>
                  )}
                </div>
              </div>
            )}
          </Card>
          {/* Player cursors overlay */}
          {participantId && session.participants && (
            <PlayerCursors
              gameSessionId={session._id}
              participantId={participantId}
              participants={session.participants}
              cursors={session.sharedState?.cursors}
              containerRef={gameContainerRef as React.RefObject<HTMLDivElement>}
            />
          )}
        </div>
      </div>

      {/* Participants sidebar */}
      <div className="fixed bottom-4 right-4 w-56 space-y-3">
        {participantId && session.participants && (
          <>
            <ControlPanel
              gameSessionId={session._id}
              participants={session.participants}
              currentParticipantId={participantId}
              isHost={!!session.participants.find(
                (p: { participantId: string; isHost: boolean }) =>
                  p.participantId === participantId && p.isHost
              )}
              controlMode={session.sharedState?.controlMode}
              controlledBy={session.sharedState?.controlledBy}
            />
            <PlayerList
              participants={session.participants}
              currentParticipantId={participantId}
              cursors={session.sharedState?.cursors}
            />
          </>
        )}
      </div>
    </div>
  );
}
