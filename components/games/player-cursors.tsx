"use client";

import { useEffect, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Vibrant colors for players
const PLAYER_COLORS = [
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#FFE66D", // Yellow
  "#95E1D3", // Mint
  "#F38181", // Coral
  "#AA96DA", // Purple
  "#FCBAD3", // Pink
  "#A8D8EA", // Sky Blue
  "#FF9F43", // Orange
  "#6BCB77", // Green
];

interface Participant {
  participantId: string;
  displayName: string;
  isHost: boolean;
  isActive: boolean;
}

interface CursorData {
  x: number;
  y: number;
  lastUpdate: number;
}

interface PlayerCursorsProps {
  gameSessionId: Id<"gameSessions">;
  participantId: string;
  participants: Participant[];
  cursors?: Record<string, CursorData>;
  containerRef: React.RefObject<HTMLDivElement>;
}

// Get consistent color for a participant
function getParticipantColor(participantId: string, participants: Participant[]): string {
  const index = participants.findIndex((p) => p.participantId === participantId);
  return PLAYER_COLORS[index % PLAYER_COLORS.length];
}

// Cursor SVG component
function CursorIcon({ color }: { color: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(1px 1px 1px rgba(0,0,0,0.3))" }}
    >
      <path
        d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L6.35 2.85a.5.5 0 0 0-.85.36Z"
        fill={color}
        stroke="white"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function PlayerCursors({
  gameSessionId,
  participantId,
  participants,
  cursors = {},
  containerRef,
}: PlayerCursorsProps) {
  const updateCursor = useMutation(api.wordGames.updateCursorPosition);
  const lastUpdateRef = useRef<number>(0);
  const lastPosRef = useRef<{ x: number; y: number }>({ x: -1, y: -1 });
  const throttleMs = 33; // ~30fps for real-time feel
  const minMoveDelta = 1; // Minimum movement (in %) before sending update

  // Track mouse movement
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!containerRef.current) return;

      const now = Date.now();
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      // Check if within bounds
      if (x < 0 || x > 100 || y < 0 || y > 100) return;

      // Check if enough time has passed and position changed significantly
      const dx = Math.abs(x - lastPosRef.current.x);
      const dy = Math.abs(y - lastPosRef.current.y);
      const hasMovedEnough = dx > minMoveDelta || dy > minMoveDelta;
      const throttlePassed = now - lastUpdateRef.current >= throttleMs;

      if (hasMovedEnough && throttlePassed) {
        lastUpdateRef.current = now;
        lastPosRef.current = { x, y };
        updateCursor({
          gameSessionId,
          participantId,
          x,
          y,
        });
      }
    },
    [gameSessionId, participantId, updateCursor, containerRef]
  );

  // Attach mouse listener to container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("mousemove", handleMouseMove);
    return () => container.removeEventListener("mousemove", handleMouseMove);
  }, [containerRef, handleMouseMove]);

  // Filter out own cursor and stale cursors (older than 5 seconds)
  const now = Date.now();
  const activeCursors = Object.entries(cursors).filter(
    ([pid, cursor]) =>
      pid !== participantId && now - cursor.lastUpdate < 5000
  );

  return (
    <>
      {activeCursors.map(([pid, cursor]) => {
        const participant = participants.find((p) => p.participantId === pid);
        if (!participant || !participant.isActive) return null;

        const color = getParticipantColor(pid, participants);

        return (
          <div
            key={pid}
            className="absolute pointer-events-none z-50"
            style={{
              left: `${cursor.x}%`,
              top: `${cursor.y}%`,
              transform: "translate(-2px, -2px)",
              transition: "left 50ms linear, top 50ms linear",
            }}
          >
            <CursorIcon color={color} />
            <div
              className="absolute left-5 top-4 px-2 py-0.5 rounded text-xs font-medium text-white whitespace-nowrap"
              style={{ backgroundColor: color }}
            >
              {participant.displayName}
            </div>
          </div>
        );
      })}
    </>
  );
}

// Player list sidebar component
interface PlayerListProps {
  participants: Participant[];
  currentParticipantId: string;
  cursors?: Record<string, CursorData>;
}

export function PlayerList({
  participants,
  currentParticipantId,
  cursors = {},
}: PlayerListProps) {
  const now = Date.now();

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden">
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Players ({participants.filter((p) => p.isActive).length})
        </h3>
      </div>
      <ul className="divide-y divide-gray-50">
        {participants
          .filter((p) => p.isActive)
          .map((participant) => {
            const color = getParticipantColor(participant.participantId, participants);
            const cursor = cursors[participant.participantId];
            const isOnline = cursor && now - cursor.lastUpdate < 5000;
            const isYou = participant.participantId === currentParticipantId;

            return (
              <li
                key={participant.participantId}
                className="px-3 py-2 flex items-center gap-2"
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className={`text-sm flex-1 truncate ${isYou ? "font-semibold" : ""}`}>
                  {participant.displayName}
                  {isYou && " (You)"}
                </span>
                {participant.isHost && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">
                    Host
                  </span>
                )}
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOnline ? "bg-green-500" : "bg-gray-300"
                  }`}
                  title={isOnline ? "Active" : "Idle"}
                />
              </li>
            );
          })}
      </ul>
    </div>
  );
}

// Player inputs display - shows what other players are typing
interface InputData {
  value: string;
  itemIndex: number;
  lastUpdate: number;
}

interface PlayerInputsProps {
  participants: Participant[];
  currentParticipantId: string;
  currentItemIndex: number;
  inputs?: Record<string, InputData>;
}

export function PlayerInputs({
  participants,
  currentParticipantId,
  currentItemIndex,
  inputs = {},
}: PlayerInputsProps) {
  const now = Date.now();

  // Filter to show only other players' inputs on the same item, recent (last 10 seconds)
  const otherInputs = Object.entries(inputs).filter(
    ([pid, input]) =>
      pid !== currentParticipantId &&
      input.itemIndex === currentItemIndex &&
      now - input.lastUpdate < 10000 &&
      input.value.trim().length > 0
  );

  if (otherInputs.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs text-gray-500 font-medium">Other players:</p>
      <div className="flex flex-wrap gap-2">
        {otherInputs.map(([pid, input]) => {
          const participant = participants.find((p) => p.participantId === pid);
          if (!participant || !participant.isActive) return null;

          const color = getParticipantColor(pid, participants);

          return (
            <div
              key={pid}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200"
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-gray-600 font-medium">
                {participant.displayName}:
              </span>
              <span
                className="text-sm font-mono px-2 py-0.5 rounded"
                style={{ backgroundColor: `${color}20`, color: color }}
              >
                {input.value || "..."}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Control Panel - Host can grant control to specific players
interface ControlPanelProps {
  gameSessionId: Id<"gameSessions">;
  participants: Participant[];
  currentParticipantId: string;
  isHost: boolean;
  controlMode?: "host_only" | "single" | "free";
  controlledBy?: string;
}

export function ControlPanel({
  gameSessionId,
  participants,
  currentParticipantId,
  isHost,
  controlMode = "free",
  controlledBy,
}: ControlPanelProps) {
  const grantControl = useMutation(api.wordGames.grantControl);
  const setControlMode = useMutation(api.wordGames.setControlMode);

  const activeParticipants = participants.filter((p) => p.isActive);
  const controlledParticipant = participants.find(
    (p) => p.participantId === controlledBy
  );

  const handleModeChange = async (mode: "host_only" | "single" | "free") => {
    await setControlMode({
      gameSessionId,
      hostParticipantId: currentParticipantId,
      controlMode: mode,
      controlledBy: mode === "free" ? undefined : controlledBy,
    });
  };

  const handleGrantControl = async (targetParticipantId: string) => {
    await grantControl({
      gameSessionId,
      hostParticipantId: currentParticipantId,
      targetParticipantId,
    });
  };

  // Non-hosts just see who has control
  if (!isHost) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-100 p-3">
        <div className="text-xs text-gray-500 mb-1">Control</div>
        <div className="text-sm font-medium">
          {controlMode === "free" && "Everyone can interact"}
          {controlMode === "host_only" && "Host only"}
          {controlMode === "single" && controlledParticipant && (
            <span className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: getParticipantColor(
                    controlledBy || "",
                    participants
                  ),
                }}
              />
              {controlledParticipant.displayName}
              {controlledBy === currentParticipantId && " (You)"}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Host controls
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden">
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">Control Mode</h3>
      </div>
      <div className="p-3 space-y-3">
        {/* Mode selector */}
        <div className="flex gap-1">
          <button
            onClick={() => handleModeChange("free")}
            className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors ${
              controlMode === "free"
                ? "bg-green-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Free
          </button>
          <button
            onClick={() => handleModeChange("single")}
            className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors ${
              controlMode === "single"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Single
          </button>
          <button
            onClick={() => handleModeChange("host_only")}
            className={`flex-1 px-2 py-1.5 text-xs rounded transition-colors ${
              controlMode === "host_only"
                ? "bg-amber-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Host
          </button>
        </div>

        {/* Player list for granting control (only in single mode) */}
        {controlMode === "single" && (
          <div className="space-y-1">
            <div className="text-xs text-gray-500">Give control to:</div>
            {activeParticipants.map((p) => {
              const color = getParticipantColor(p.participantId, participants);
              const hasControl = controlledBy === p.participantId;

              return (
                <button
                  key={p.participantId}
                  onClick={() => handleGrantControl(p.participantId)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm transition-colors ${
                    hasControl
                      ? "bg-blue-50 border border-blue-200"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="flex-1 truncate">
                    {p.displayName}
                    {p.isHost && " (Host)"}
                  </span>
                  {hasControl && (
                    <span className="text-xs text-blue-600 font-medium">
                      Active
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Mode descriptions */}
        <div className="text-[10px] text-gray-400">
          {controlMode === "free" && "All players can interact simultaneously"}
          {controlMode === "single" && "Only selected player can interact"}
          {controlMode === "host_only" && "Only you (host) can interact"}
        </div>
      </div>
    </div>
  );
}

export default PlayerCursors;
