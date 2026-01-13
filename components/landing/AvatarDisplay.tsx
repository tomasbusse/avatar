"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { MessageCircle, Volume2, VolumeX, Sparkles, Play, Bug } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

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
}

export function AvatarDisplay({
  avatarId,
  className,
  profileImage,
  avatarName = "Emma",
  avatarGreeting,
  isLoading: dataLoading = false,
  debug: debugProp = false,
}: AvatarDisplayProps) {
  const t = useTranslations("hero");
  const searchParams = useSearchParams();
  const [isActivated, setIsActivated] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
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
      profileImageUrl: profileImage?.substring(0, 50) + "...",
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
    logDebug("Play button clicked - Starting activation", {
      avatarId,
      avatarName,
      hasProfileImage: !!profileImage,
    });
    setIsActivating(true);

    // Simulate avatar loading - in production this would connect to LiveKit
    logDebug("Simulating LiveKit connection...");
    setTimeout(() => {
      logDebug("Activation complete - Avatar now live");
      setIsActivating(false);
      setIsActivated(true);
    }, 1500);
  };

  // Show loading state while data is being fetched
  const isLoading = dataLoading || isActivating;

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

        {/* Initial State: Profile Image with Play Button */}
        {!isActivated && !isActivating && (
          <>
            {/* Profile Image Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-sls-teal via-sls-olive to-sls-teal" />

            {/* Avatar Profile Image */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {profileImage ? (
                  <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-white/20 shadow-xl">
                    <Image
                      src={profileImage}
                      alt={avatarName}
                      width={192}
                      height={192}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-48 h-48 rounded-full bg-sls-cream/10 backdrop-blur-sm border-4 border-white/20 flex items-center justify-center">
                    <span className="text-6xl font-bold text-white/80">
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
            </div>

            {/* Play Button Overlay */}
            <button
              onClick={handleActivate}
              className="absolute inset-0 flex items-center justify-center group cursor-pointer"
            >
              <div className={cn(
                "w-20 h-20 rounded-full bg-sls-orange flex items-center justify-center shadow-xl transition-all",
                "group-hover:scale-110 group-hover:shadow-2xl group-hover:shadow-sls-orange/40",
                "group-active:scale-95"
              )}>
                <Play className="w-8 h-8 text-white ml-1" fill="white" />
              </div>
            </button>

            {/* Decorative Particles */}
            <div className="absolute top-8 right-8 animate-bounce">
              <Sparkles className="w-6 h-6 text-sls-chartreuse/60" />
            </div>
            <div className="absolute bottom-20 left-8 animate-pulse">
              <Sparkles className="w-4 h-4 text-white/40" />
            </div>

            {/* Click to Start Badge */}
            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 text-sls-teal text-xs font-semibold">
              {dataLoading ? (
                <>
                  <div className="w-3 h-3 border-2 border-sls-teal/30 border-t-sls-teal rounded-full animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" />
                  {t("clickToStart") || "Click to Start"}
                </>
              )}
            </div>
          </>
        )}

        {/* Loading State (when clicking play to activate) */}
        {isActivating && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-sls-teal to-sls-olive">
            <div className="text-center text-white">
              <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4 mx-auto" />
              <p className="text-sm opacity-80">{t("loadingAvatar")}</p>
            </div>
          </div>
        )}

        {/* Activated State: Live Avatar */}
        {isActivated && (
          <>
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-sls-teal via-sls-olive to-sls-teal" />

            {/* Avatar Image - This would be replaced with actual LiveKit video */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {profileImage ? (
                  <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-white/20 shadow-xl">
                    <Image
                      src={profileImage}
                      alt={avatarName}
                      width={192}
                      height={192}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-48 h-48 rounded-full bg-sls-cream/10 backdrop-blur-sm border-4 border-white/20 flex items-center justify-center">
                    <span className="text-6xl font-bold text-white/80">
                      {avatarName.charAt(0)}
                    </span>
                  </div>
                )}

                {/* Animated Ring - Active state */}
                <div
                  className={cn(
                    "absolute inset-0 rounded-full border-4 border-sls-chartreuse transition-all duration-500",
                    isHovered ? "scale-110 opacity-100" : "scale-105 opacity-80"
                  )}
                />

                {/* Pulse Effect - indicates live */}
                <div className="absolute inset-0 rounded-full bg-sls-chartreuse/20 animate-ping opacity-75" />
              </div>
            </div>

            {/* Decorative Particles */}
            <div className="absolute top-8 right-8 animate-bounce">
              <Sparkles className="w-6 h-6 text-sls-chartreuse/60" />
            </div>
            <div className="absolute bottom-20 left-8 animate-pulse">
              <Sparkles className="w-4 h-4 text-white/40" />
            </div>

            {/* AI Badge - Active */}
            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-sls-chartreuse/90 text-sls-teal text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-sls-teal animate-pulse" />
              AI Avatar Live
            </div>

            {/* Mute Button */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="absolute top-4 right-4 p-3 rounded-full bg-white/20 backdrop-blur-sm text-white transition-all hover:bg-white/30"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
          </>
        )}

        {/* Speech Bubble - Always visible except during activation */}
        {!isActivating && (
          <div
            className={cn(
              "absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-white/95 backdrop-blur-sm shadow-lg transition-all duration-300",
              "opacity-100 translate-y-0"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-sls-teal flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sls-teal font-medium text-sm">{avatarName}</p>
                <p className="text-sls-olive text-sm mt-0.5">
                  {greeting}
                </p>
              </div>
            </div>
          </div>
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
                <div>avatarId: {avatarId || "undefined"}</div>
                <div>avatarName: {avatarName}</div>
                <div>profileImage: {profileImage ? "✅ loaded" : "❌ missing"}</div>
                <div>dataLoading: {dataLoading ? "⏳ true" : "✅ false"}</div>
                <div>isActivating: {isActivating ? "⏳ true" : "false"}</div>
                <div>isActivated: {isActivated ? "✅ true" : "false"}</div>
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
