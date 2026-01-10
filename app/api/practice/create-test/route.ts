import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get first active avatar
    const avatar = await fetchQuery(api.avatars.getFirstActiveAvatar);

    if (!avatar) {
      return NextResponse.json({ error: "No avatar found" }, { status: 404 });
    }

    // Create a test conversation practice
    const result = await fetchMutation(api.conversationPractice.create, {
      title: "English Speaking Practice",
      description: "Practice your English speaking skills with Emma",
      mode: "free_conversation",
      avatarId: avatar._id,
      behaviorConfig: {
        conversationStyle: "discussion",
        difficultyAdaptation: true,
        allowTopicDrift: true,
        targetDurationMinutes: 15,
      },
      accessMode: "both",
      guestSettings: {
        collectName: true,
        nameRequired: true,
        welcomeNote: "Welcome! Enter your name to start practicing.",
      },
      entryFlowConfig: {
        startButton: {
          text: "Start Practice",
          variant: "gradient",
          animation: "breathe",
        },
        waitingScreen: {
          text: "{avatarName} is getting ready...",
          animation: "pulse",
        },
      },
    });

    const joinUrl = `/practice/join/${result.shareToken}`;

    return NextResponse.json({
      success: true,
      practiceId: result.practiceId,
      shareToken: result.shareToken,
      joinUrl,
      fullUrl: `http://localhost:3000${joinUrl}`,
    });
  } catch (error) {
    console.error("Failed to create practice:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create practice" },
      { status: 500 }
    );
  }
}
