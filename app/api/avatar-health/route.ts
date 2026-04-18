import { AccessToken } from "livekit-server-sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Uniform avatar-subsystem health check.
 *
 * Polled every 5 minutes by a cross-project monitor. Response contract is
 * shared across all 4 avatar projects — DO NOT drift from the schema.
 *
 * Rules:
 * - Always returns HTTP 200 (status lives in the body).
 * - Never includes secret values in the response.
 * - `agent.reachable` is always false here; the Hetzner-side monitor performs
 *   the real worker ping. It does NOT block overall `ok`.
 */

type CheckResult = {
  ok: boolean;
  message: string;
  canMintToken?: boolean;
  configured?: boolean;
  reachable?: boolean;
};

type HealthResponse = {
  ok: boolean;
  project: "beethoven";
  timestamp: string;
  version: string | null;
  checks: {
    livekit: { ok: boolean; message: string; canMintToken: boolean };
    bithuman: { ok: boolean; message: string; configured: boolean };
    gemini: { ok: boolean; message: string; configured: boolean };
    agent: { ok: boolean; message: string; reachable: boolean };
  };
  degradedReason: string | null;
};

async function checkLivekit(): Promise<{ ok: boolean; message: string; canMintToken: boolean }> {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (!apiKey || !apiSecret || !wsUrl) {
    return {
      ok: false,
      message: "missing LIVEKIT_API_KEY, LIVEKIT_API_SECRET, or LIVEKIT_URL",
      canMintToken: false,
    };
  }

  try {
    const at = new AccessToken(apiKey, apiSecret, {
      identity: "health-probe",
      ttl: 60,
    });
    at.addGrant({ room: "health-probe", roomJoin: false });
    const token = await at.toJwt();
    if (!token || typeof token !== "string" || token.length < 10) {
      return { ok: false, message: "token mint produced empty result", canMintToken: false };
    }
    return { ok: true, message: "token minted", canMintToken: true };
  } catch (err) {
    console.error("[avatar-health] livekit token mint failed", {
      error: (err as Error)?.message ?? String(err),
    });
    return {
      ok: false,
      message: `token mint failed: ${(err as Error)?.message ?? "unknown error"}`,
      canMintToken: false,
    };
  }
}

function checkBithuman(): { ok: boolean; message: string; configured: boolean } {
  const hasSecret = !!process.env.BITHUMAN_API_SECRET;
  const hasFigure = !!process.env.BITHUMAN_FIGURE_ID;
  const configured = hasSecret && hasFigure;

  if (configured) {
    return {
      ok: true,
      message: "api secret and figure id present",
      configured: true,
    };
  }

  const missing: string[] = [];
  if (!hasSecret) missing.push("BITHUMAN_API_SECRET");
  if (!hasFigure) missing.push("BITHUMAN_FIGURE_ID");
  return {
    ok: false,
    message: `missing ${missing.join(", ")}`,
    configured: false,
  };
}

function checkGemini(): { ok: boolean; message: string; configured: boolean } {
  const configured = !!process.env.GOOGLE_API_KEY;
  return {
    ok: configured,
    message: configured ? "GOOGLE_API_KEY present" : "missing GOOGLE_API_KEY",
    configured,
  };
}

function checkAgent(): { ok: boolean; message: string; reachable: boolean } {
  // beethoven dispatches to the named worker "beethoven-teacher" on Hetzner.
  // The real reachability probe lives in the Hetzner-side monitor. We do not
  // attempt it here and we do not block overall ok on it.
  return {
    ok: true,
    message: "agent reachability will be checked by Hetzner-side monitor",
    reachable: false,
  };
}

export async function GET() {
  const [livekit, bithuman, gemini, agent] = await Promise.all([
    checkLivekit(),
    Promise.resolve(checkBithuman()),
    Promise.resolve(checkGemini()),
    Promise.resolve(checkAgent()),
  ]);

  const failing: string[] = [];
  if (!livekit.ok) failing.push("livekit");
  if (!bithuman.ok) failing.push("bithuman");
  if (!gemini.ok) failing.push("gemini");
  if (!agent.ok) failing.push("agent");

  const body: HealthResponse = {
    ok: failing.length === 0,
    project: "beethoven",
    timestamp: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    checks: { livekit, bithuman, gemini, agent },
    degradedReason: failing.length === 0 ? null : failing.join(","),
  };

  return NextResponse.json(body, { status: 200 });
}
