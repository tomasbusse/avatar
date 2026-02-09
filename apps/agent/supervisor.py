#!/usr/bin/env python3
"""
Agent supervisor - manages start/stop/restart of the LiveKit agent.
Polls Convex for commands when the agent is stopped, so 'start' works from admin UI.

Usage: python supervisor.py
"""
import os
import sys
import time
import signal
import subprocess
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [Supervisor] %(message)s")
log = logging.getLogger("supervisor")

# Load .env if python-dotenv is available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

CONVEX_URL = os.environ.get("NEXT_PUBLIC_CONVEX_URL") or os.environ.get("CONVEX_URL", "")
POLL_INTERVAL = 5  # seconds


def convex_query(client, path, args=None):
    resp = client.post(f"{CONVEX_URL}/api/query", json={
        "path": path, "args": args or {}, "format": "json",
    })
    resp.raise_for_status()
    return resp.json().get("value")


def convex_mutation(client, path, args=None):
    resp = client.post(f"{CONVEX_URL}/api/mutation", json={
        "path": path, "args": args or {}, "format": "json",
    })
    resp.raise_for_status()


def update_status(client, running, pid=None, logs=""):
    try:
        convex_mutation(client, "agentControl:updateStatus", {
            "running": running, "pid": pid, "logs": logs,
        })
    except Exception as e:
        log.warning(f"Failed to update status: {e}")


def clear_command(client):
    try:
        convex_mutation(client, "agentControl:clearCommand")
    except Exception:
        pass


def get_command(client):
    try:
        return convex_query(client, "agentControl:getPendingCommand")
    except Exception:
        return None


def run_agent():
    """Start the agent as a subprocess and return the process."""
    agent_dir = os.path.dirname(os.path.abspath(__file__))
    venv_python = os.path.join(agent_dir, "venv", "bin", "python")
    main_py = os.path.join(agent_dir, "main.py")

    if not os.path.exists(venv_python):
        venv_python = sys.executable  # fallback

    log.info(f"Starting agent: {venv_python} {main_py} dev")
    proc = subprocess.Popen(
        [venv_python, main_py, "dev"],
        cwd=agent_dir,
        stdout=sys.stdout,
        stderr=sys.stderr,
    )
    return proc


def main():
    if not CONVEX_URL:
        log.error("No CONVEX_URL set - cannot run supervisor")
        sys.exit(1)

    import httpx
    client = httpx.Client(timeout=10.0)

    agent_proc = None
    agent_running = False

    def stop_agent():
        nonlocal agent_proc, agent_running
        if agent_proc and agent_proc.poll() is None:
            log.info(f"Stopping agent (PID {agent_proc.pid})...")
            agent_proc.terminate()
            try:
                agent_proc.wait(timeout=10)
            except subprocess.TimeoutExpired:
                agent_proc.kill()
                agent_proc.wait()
        agent_proc = None
        agent_running = False

    def handle_signal(signum, frame):
        log.info(f"Received signal {signum}, shutting down...")
        stop_agent()
        update_status(client, False, logs="Supervisor stopped")
        sys.exit(0)

    signal.signal(signal.SIGTERM, handle_signal)
    signal.signal(signal.SIGINT, handle_signal)

    # Auto-start the agent
    log.info("Supervisor starting - launching agent...")
    agent_proc = run_agent()
    agent_running = True
    update_status(client, True, str(agent_proc.pid), "Agent started by supervisor")

    while True:
        time.sleep(POLL_INTERVAL)

        # Check if agent process is still alive
        if agent_proc and agent_proc.poll() is not None:
            exit_code = agent_proc.returncode
            log.info(f"Agent exited with code {exit_code}")
            agent_proc = None
            agent_running = False
            update_status(client, False, logs=f"Agent exited (code {exit_code})")

        # Check for commands
        command = get_command(client)
        if not command:
            continue

        log.info(f"Received command: {command}")
        clear_command(client)

        if command == "start" and not agent_running:
            agent_proc = run_agent()
            agent_running = True
            update_status(client, True, str(agent_proc.pid), "Agent started")
            log.info(f"Agent started (PID {agent_proc.pid})")

        elif command == "stop" and agent_running:
            stop_agent()
            update_status(client, False, logs="Stopped by admin")
            log.info("Agent stopped")

        elif command == "restart":
            stop_agent()
            update_status(client, False, logs="Restarting...")
            time.sleep(1)
            agent_proc = run_agent()
            agent_running = True
            update_status(client, True, str(agent_proc.pid), "Agent restarted")
            log.info(f"Agent restarted (PID {agent_proc.pid})")


if __name__ == "__main__":
    main()
