#!/usr/bin/env npx ts-node
/**
 * Agent Watcher - Local service that monitors Convex for commands
 * and controls the Python agent on this machine.
 *
 * Run with: npx ts-node scripts/agent-watcher.ts
 * Or: npm run agent:watch
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://healthy-snail-919.convex.cloud";
const AGENT_DIR = process.env.AGENT_DIR || "/Users/tomas/apps/beethoven/apps/agent";
const POLL_INTERVAL = 2000; // Check every 2 seconds

const convex = new ConvexHttpClient(CONVEX_URL);

async function getAgentStatus(): Promise<{ running: boolean; pid: string | null }> {
  try {
    const { stdout } = await execAsync(
      'ps aux | grep "[p]ython.*main.py" | awk \'{print $2}\' | head -1',
      { shell: "/bin/bash" }
    );
    const pid = stdout.trim();
    return { running: !!pid, pid: pid || null };
  } catch {
    return { running: false, pid: null };
  }
}

async function getLogs(): Promise<string> {
  try {
    const { stdout } = await execAsync("tail -30 /tmp/agent_bilingual.log", { shell: "/bin/bash" });
    return stdout.slice(-1000);
  } catch {
    return "No logs available";
  }
}

async function stopAgent(): Promise<void> {
  console.log("🛑 Stopping agent...");
  try {
    await execAsync(`${AGENT_DIR}/scripts/stop-agent.sh`, { shell: "/bin/bash" });
  } catch {
    // Fallback
    try {
      await execAsync('pkill -TERM -f "python.*main.py"');
      await new Promise(r => setTimeout(r, 2000));
      await execAsync('pkill -KILL -f "multiprocessing.spawn"');
    } catch {
      // May not be running
    }
  }
}

async function startAgent(): Promise<void> {
  console.log("🚀 Starting agent...");

  // Clear cache
  try {
    await execAsync(`find ${AGENT_DIR} -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true`);
  } catch {}

  // Create log file
  await execAsync('echo "=== Agent started at $(date) ===" > /tmp/agent_bilingual.log', { shell: "/bin/bash" });

  // Start agent
  await execAsync(
    `cd ${AGENT_DIR} && ./venv/bin/python main.py dev >> /tmp/agent_bilingual.log 2>&1 &`,
    { shell: "/bin/bash" }
  );

  // Wait for startup
  await new Promise(r => setTimeout(r, 4000));
}

async function updateStatus(): Promise<void> {
  const { running, pid } = await getAgentStatus();
  const logs = await getLogs();

  await convex.mutation(api.agentControl.updateStatus, {
    running,
    pid,
    logs,
  });
}

async function processCommand(command: string): Promise<void> {
  console.log(`📝 Processing command: ${command}`);

  switch (command) {
    case "stop":
      await stopAgent();
      break;
    case "start":
      const status = await getAgentStatus();
      if (!status.running) {
        await startAgent();
      } else {
        console.log("Agent already running");
      }
      break;
    case "restart":
      await stopAgent();
      await new Promise(r => setTimeout(r, 1000));
      await startAgent();
      break;
  }

  // Clear the command
  await convex.mutation(api.agentControl.clearCommand);

  // Update status after command
  await new Promise(r => setTimeout(r, 1000));
  await updateStatus();
}

async function main() {
  console.log("🔍 Agent Watcher started");
  console.log(`   Convex URL: ${CONVEX_URL}`);
  console.log(`   Agent Dir: ${AGENT_DIR}`);
  console.log(`   Poll Interval: ${POLL_INTERVAL}ms`);
  console.log("");

  // Initial status update
  await updateStatus();
  console.log("✅ Initial status sent to Convex");

  // Main loop
  while (true) {
    try {
      // Check for pending command
      const command = await convex.query(api.agentControl.getPendingCommand);

      if (command) {
        await processCommand(command);
      }

      // Update status periodically
      await updateStatus();

    } catch (error) {
      console.error("Error in watcher loop:", error);
    }

    await new Promise(r => setTimeout(r, POLL_INTERVAL));
  }
}

main().catch(console.error);
