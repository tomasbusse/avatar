import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const agentDir = process.env.AGENT_DIR || "/Users/tomas/apps/beethoven/apps/agent";

async function stopAgent(): Promise<{ success: boolean; message: string }> {
  try {
    // Use the stop script for graceful shutdown
    await execAsync(`${agentDir}/scripts/stop-agent.sh`, { shell: "/bin/bash" });
    return { success: true, message: "Agent stopped successfully" };
  } catch {
    // Fallback to pkill if script fails
    try {
      await execAsync('pkill -TERM -f "python.*main.py"');
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await execAsync('pkill -KILL -f "multiprocessing.spawn"');
      return { success: true, message: "Agent stopped (fallback method)" };
    } catch {
      return { success: true, message: "Agent was not running" };
    }
  }
}

async function startAgent(): Promise<{ success: boolean; message: string; logs: string }> {
  // Check if already running
  try {
    const { stdout: pid } = await execAsync('pgrep -f "python.*main.py" || echo ""');
    if (pid.trim()) {
      return { success: false, message: "Agent is already running", logs: "" };
    }
  } catch {}

  // Clear Python cache
  try {
    await execAsync(`find ${agentDir} -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true`);
    await execAsync(`find ${agentDir} -type f -name "*.pyc" -delete 2>/dev/null || true`);
  } catch {
    // Cache clearing may fail if files don't exist
  }

  // Create/clear log file first
  await execAsync("touch /tmp/agent_bilingual.log && echo '=== Agent started at $(date) ===' > /tmp/agent_bilingual.log", { shell: "/bin/bash" });

  // Start the agent using full path to venv python
  await execAsync(
    `cd ${agentDir} && ./venv/bin/python main.py dev >> /tmp/agent_bilingual.log 2>&1 &`,
    { shell: "/bin/bash" }
  );

  // Wait for agent to start
  await new Promise((resolve) => setTimeout(resolve, 4000));

  // Check if agent started successfully
  let logOutput = "Starting agent...";
  let isRunning = false;
  try {
    const { stdout: logs } = await execAsync("tail -30 /tmp/agent_bilingual.log 2>/dev/null || echo 'Log file not ready'");
    logOutput = logs;
    isRunning = logOutput.includes("registered worker") || logOutput.includes("Prewarm complete") || logOutput.includes("Worker running");
  } catch {
    logOutput = "Agent starting, logs not yet available";
  }

  // Also check if process is running
  try {
    const { stdout: pid } = await execAsync('pgrep -f "python.*main.py" || echo ""');
    if (pid.trim()) {
      isRunning = true;
    }
  } catch {}

  return {
    success: isRunning,
    message: isRunning ? "Agent started successfully" : "Agent start initiated (check logs)",
    logs: logOutput.slice(-1000),
  };
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get action from request body
    const body = await request.json().catch(() => ({}));
    const action = body.action || "restart"; // Default to restart for backwards compatibility

    switch (action) {
      case "start": {
        const result = await startAgent();
        return NextResponse.json(result);
      }

      case "stop": {
        const result = await stopAgent();
        return NextResponse.json(result);
      }

      case "restart": {
        // Stop first
        await stopAgent();
        await new Promise((resolve) => setTimeout(resolve, 1000));
        // Then start
        const result = await startAgent();
        return NextResponse.json({
          ...result,
          message: result.success ? "Agent restarted successfully" : "Agent restart initiated (check logs)",
        });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Agent control error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to control agent" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Check if agent is running
    const { stdout } = await execAsync('pgrep -f "python.*main.py" || echo "not running"');
    const isRunning = stdout.trim() !== "not running";

    // Get recent logs
    let logs = "";
    try {
      const { stdout: logOutput } = await execAsync("tail -30 /tmp/agent_bilingual.log");
      logs = logOutput;
    } catch {
      logs = "No logs available";
    }

    return NextResponse.json({
      running: isRunning,
      pid: isRunning ? stdout.trim() : null,
      logs: logs.slice(-1000),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
