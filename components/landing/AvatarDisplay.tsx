"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { MessageCircle, Sparkles, Play, Bug } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import dynamic from "next/dynamic";

// Dynamically import LandingAvatarRoom to avoid SSR issues with LiveKit
const LandingAvatarRoom = dynamic(
  () => import("./LandingAvatarRoom").then((mod) => mod.LandingAvatarRoom),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-sls-teal to-sls-olive rounded-3xl">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4 mx-auto" />
          <p className="text-sm opacity-80">Connecting...</p>
        </div>
      </div>
    ),
  }
);

interface DebugLog {
  timestamp: string;
  event: string;
  data?: Record<string, unknown>;
}

interface AvatarDisplayProps {
  avatarId?: string;
  className?: string;
  profileImage?: string;
  avatarName?: string;
  avatarGreeting?: string;
  isLoading?: boolean;
  debug?: boolean;
  /** Full avatar object for LiveKit connection */
  avatar?: {
    _id: string;
    name: string;
    profileImage?: string;
    visionConfig?: {
      enabled?: boolean;
      captureWebcam?: boolean;
    };
    [key: string]: any;
  };
}

export function AvatarDisplay({
  avatarId,
  className,
  profileImage,
  avatarName = "Emma",
  avatarGreeting,
  isLoading: dataLoading = false,
  debug: debugProp = false,
  avatar,
}: AvatarDisplayProps) {
  const t = useTranslations("hero");
  const searchParams = useSearchParams();
  const [isActivated, setIsActivated] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // Check for debug mode via URL param or prop
  const debugMode = debugProp || searchParams.get("debug") === "true";

  // Debug logging function
  const logDebug = (event: string, data?: Record<string, unknown>) => {
    if (!debugMode) return;
    const log: DebugLog = {
      timestamp: new Date().toISOString().split("T")[1].split(".")[0],
      event,
      data,
    };
    console.log(`[Avatar Debug] ${log.timestamp} - ${event}`, data || "");
    setDebugLogs((prev) => [...prev.slice(-19), log]); // Keep last 20 logs
  };

  // Log initial mount and data changes
  useEffect(() => {
    logDebug("Component mounted", {
      avatarId,
      avatarName,
      hasProfileImage: !!profileImage,
      hasFullAvatar: !!avatar,
      visionEnabled: avatar?.visionConfig?.enabled,
      dataLoading,
    });
  }, []);

  useEffect(() => {
    logDebug("Data loading state changed", { dataLoading });
  }, [dataLoading]);

  useEffect(() => {
    if (profileImage) {
      logDebug("Profile image received", { url: profileImage });
    }
  }, [profileImage]);

  // Greeting text from props (CMS) or fallback to translation
  const greeting = avatarGreeting || t("avatarGreeting");

  // Handle play button click to activate live avatar
  const handleActivate = () => {
    if (!avatar) {
      logDebug("Cannot activate - no avatar data", { avatarId });
      return;
    }
    logDebug("Play button clicked - Starting LiveKit connection", {
      avatarId: avatar._id,
      avatarName: avatar.name,
      visionEnabled: avatar.visionConfig?.enabled,
    });
    setIsActivated(true);
  };

  // Handle closing the LiveKit session
  const handleClose = () => {
    logDebug("LiveKit session closed");
    setIsActivated(false);
  };

  // Build avatar object for LiveKit (use full avatar if available, otherwise construct from props)
  const avatarForLiveKit = avatar || (avatarId ? {
    _id: avatarId,
    name: avatarName,
    profileImage,
  } : null);

  return (
    <div
      className={cn(
        "relative w-full max-w-md",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Avatar Container */}
      <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-gradient-to-br from-sls-teal to-sls-olive shadow-2xl shadow-sls-teal/20">

        {/* Activated State: Real LiveKit Video Stream */}
        {isActivated && avatarForLiveKit && (
          <LandingAvatarRoom
            avatar={avatarForLiveKit}
            onClose={handleClose}
            className="absolute inset-0"
          />
        )}

        {/* Initial State: Profile Image with Play Button */}
        {!isActivated && (
          <>
            {/* Profile Image Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-sls-teal via-sls-olive to-sls-teal" />

            {/* Avatar Profile Image with Play Button Below */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-4 pb-28 sm:pb-32">
              {/* Profile Image Container */}
              <div className="relative mb-6">
                {profileImage ? (
                  <div className="w-36 h-36 sm:w-48 sm:h-48 rounded-full overflow-hidden border-4 border-white/20 shadow-xl">
                    <Image
                      src={profileImage}
                      alt={avatarName}
                      width={192}
                      height={192}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-36 h-36 sm:w-48 sm:h-48 rounded-full bg-sls-cream/10 backdrop-blur-sm border-4 border-white/20 flex items-center justify-center">
                    <span className="text-5xl sm:text-6xl font-bold text-white/80">
                      {avatarName.charAt(0)}
                    </span>
                  </div>
                )}

                {/* Animated Ring */}
                <div
                  className={cn(
                    "absolute inset-0 rounded-full border-4 border-sls-chartreuse/50 transition-all duration-500",
                    isHovered ? "scale-110 opacity-100" : "scale-100 opacity-50"
                  )}
                />
              </div>

              {/* Play Button - Positioned Below Profile Image */}
              <button
                onClick={handleActivate}
                disabled={dataLoading || !avatarForLiveKit}
                className="group cursor-pointer disabled:cursor-not-allowed"
              >
                <div className={cn(
                  "w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-sls-orange flex items-center justify-center shadow-xl transition-all",
                  "group-hover:scale-110 group-hover:shadow-2xl group-hover:shadow-sls-orange/40",
                  "group-active:scale-95",
                  "group-disabled:opacity-50 group-disabled:scale-100"
                )}>
                  <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white ml-1" fill="white" />
                </div>
              </button>
            </div>

            {/* Decorative Particles */}
            <div className="absolute top-6 sm:top-8 right-6 sm:right-8 animate-bounce">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-sls-chartreuse/60" />
            </div>
            <div className="absolute bottom-24 sm:bottom-28 left-6 sm:left-8 animate-pulse hidden sm:block">
              <Sparkles className="w-4 h-4 text-white/40" />
            </div>

            {/* Click to Start Badge */}
            <div className="absolute top-3 sm:top-4 left-3 sm:left-4 flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/90 text-sls-teal text-[10px] sm:text-xs font-semibold">
              {dataLoading ? (
                <>
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 border-2 border-sls-teal/30 border-t-sls-teal rounded-full animate-spin" />
                  <span className="hidden sm:inline">Loading...</span>
                </>
              ) : (
                <>
                  <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span className="hidden sm:inline">{t("clickToStart") || "Click to Start"}</span>
                  <span className="sm:hidden">Play</span>
                </>
              )}
            </div>

            {/* Speech Bubble */}
            <div
              className={cn(
                "absolute bottom-3 sm:bottom-6 left-3 sm:left-6 right-3 sm:right-6 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/95 backdrop-blur-sm shadow-lg transition-all duration-300",
                "opacity-100 translate-y-0"
              )}
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-sls-teal flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sls-teal font-medium text-xs sm:text-sm">{avatarName}</p>
                  <p className="text-sls-olive text-xs sm:text-sm mt-0.5 line-clamp-2">
                    {greeting}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Decorative Elements */}
      <div className="absolute -top-4 -right-4 w-24 h-24 rounded-2xl bg-sls-chartreuse/20 -z-10" />
      <div className="absolute -bottom-4 -left-4 w-32 h-32 rounded-2xl bg-sls-orange/10 -z-10" />

      {/* Debug Mode UI */}
      {debugMode && (
        <>
          {/* Debug Toggle Button */}
          <button
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className="absolute -top-2 -right-2 z-50 p-2 rounded-full bg-yellow-500 text-black shadow-lg hover:bg-yellow-400 transition-colors"
            title="Toggle Debug Panel"
          >
            <Bug className="w-4 h-4" />
          </button>

          {/* Debug Panel */}
          {showDebugPanel && (
            <div className="absolute top-8 right-0 z-50 w-80 max-h-96 overflow-auto bg-black/90 text-green-400 text-xs font-mono rounded-lg shadow-2xl p-3">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-green-400/30">
                <span className="text-yellow-400 font-bold">🐛 Avatar Debug</span>
                <button
                  onClick={() => setDebugLogs([])}
                  className="text-red-400 hover:text-red-300 text-xs"
                >
                  Clear
                </button>
              </div>

              {/* Current State */}
              <div className="mb-3 p-2 bg-green-400/10 rounded">
                <div className="text-yellow-400 font-bold mb-1">Current State:</div>
                <div>avatarId: {avatarId || avatar?._id || "undefined"}</div>
                <div>avatarName: {avatarName}</div>
                <div>profileImage: {profileImage ? "✅ loaded" : "❌ missing"}</div>
                <div>fullAvatar: {avatar ? "✅ available" : "❌ missing"}</div>
                <div>visionEnabled: {avatar?.visionConfig?.enabled ? "✅ true" : "❌ false"}</div>
                <div>dataLoading: {dataLoading ? "⏳ true" : "✅ false"}</div>
                <div>isActivated: {isActivated ? "✅ LIVE" : "false"}</div>
              </div>

              {/* Event Log */}
              <div className="text-yellow-400 font-bold mb-1">Event Log:</div>
              <div className="space-y-1">
                {debugLogs.length === 0 ? (
                  <div className="text-gray-500 italic">No events logged yet...</div>
                ) : (
                  debugLogs.map((log, i) => (
                    <div key={i} className="border-l-2 border-green-400/30 pl-2">
                      <span className="text-gray-500">{log.timestamp}</span>{" "}
                      <span className="text-green-300">{log.event}</span>
                      {log.data && (
                        <pre className="text-gray-400 text-[10px] mt-0.5 overflow-x-auto">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Debug Status Indicator */}
          <div className="absolute -bottom-8 left-0 right-0 text-center">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-600 text-xs rounded-full">
              <Bug className="w-3 h-3" />
              Debug Mode Active - Add ?debug=true to URL
            </span>
          </div>
        </>
      )}
    </div>
  );
}
