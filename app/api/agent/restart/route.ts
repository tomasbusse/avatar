import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST() {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Kill existing agent processes
    try {
      await execAsync('pkill -f "python.*main.py"');
    } catch {
      // Process may not exist, that's OK
    }

    // Clear Python cache
    const agentDir = process.env.AGENT_DIR || "/Users/tomas/apps/beethoven/apps/agent";
    try {
      await execAsync(`find ${agentDir} -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true`);
      await execAsync(`find ${agentDir} -type f -name "*.pyc" -delete 2>/dev/null || true`);
    } catch {
      // Cache clearing may fail if files don't exist
    }

    // Wait a moment for processes to die
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Create/clear log file first
    await execAsync("touch /tmp/agent_bilingual.log && echo '=== Agent restart at $(date) ===' > /tmp/agent_bilingual.log", { shell: "/bin/bash" });

    // Restart the agent
    await execAsync(
      `cd ${agentDir} && source venv/bin/activate && python main.py dev >> /tmp/agent_bilingual.log 2>&1 &`,
      { shell: "/bin/bash" }
    );

    // Wait for agent to start
    await new Promise((resolve) => setTimeout(resolve, 4000));

    // Check if agent started successfully - handle missing file gracefully
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

    return NextResponse.json({
      success: true,
      message: isRunning ? "Agent restarted successfully" : "Agent restart initiated (check logs)",
      logs: logOutput.slice(-1000),
    });
  } catch (error: any) {
    console.error("Failed to restart agent:", error);
    return NextResponse.json(
      { error: error.message || "Failed to restart agent" },
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
