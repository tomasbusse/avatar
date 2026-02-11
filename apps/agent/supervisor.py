#!/usr/bin/env python3
"""
Agent supervisor - manages start/stop/restart of the LiveKit agent.
Polls Convex for commands when the agent is stopped, so 'start' works from admin UI.
Monitors worker health and auto-restarts if workers die.

Usage: python supervisor.py
"""
import os
import sys
import time
import signal
import subprocess
import logging
import psutil

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
HEALTH_CHECK_INTERVAL = 15  # seconds - check worker health
HEALTH_CHECK_GRACE_PERIOD = 30  # seconds - wait after start before health checks
MAX_CONSECUTIVE_FAILURES = 3  # restart after this many failed health checks


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


def count_worker_children(parent_pid):
    """Count live worker child processes (excluding resource trackers).
    Returns the number of actual worker processes that can handle LiveKit jobs."""
    try:
        parent = psutil.Process(parent_pid)
        children = parent.children(recursive=True)
        # Count spawn workers (actual job handlers), not resource trackers
        workers = [
            c for c in children
            if c.is_running() and "resource_tracker" not in " ".join(c.cmdline())
        ]
        return len(workers)
    except (psutil.NoSuchProcess, psutil.AccessDenied):
        return -1  # Process doesn't exist


def run_agent():
    """Start the agent as a subprocess using 'start' mode (production) and return the process."""
    agent_dir = os.path.dirname(os.path.abspath(__file__))
    venv_python = os.path.join(agent_dir, "venv", "bin", "python")
    main_py = os.path.join(agent_dir, "main.py")

    if not os.path.exists(venv_python):
        venv_python = sys.executable  # fallback

    log.info(f"Starting agent: {venv_python} {main_py} start")
    proc = subprocess.Popen(
        [venv_python, main_py, "start"],
        cwd=agent_dir,
        stdout=sys.stdout,
        stderr=sys.stderr,
    )
    return proc


def main():
    if not CONVEX_URL:
        log.error("No CONVEX_URL set - cannot run supervisor")
        sys.exit(1)

    # Check psutil is available
    try:
        import psutil  # noqa: F401
    except ImportError:
        log.error("psutil not installed - run: pip install psutil")
        sys.exit(1)

    import httpx
    client = httpx.Client(timeout=10.0)

    agent_proc = None
    agent_running = False
    last_start_time = 0
    consecutive_health_failures = 0
    last_health_check = 0

    def stop_agent():
        nonlocal agent_proc, agent_running, consecutive_health_failures
        if agent_proc and agent_proc.poll() is None:
            log.info(f"Stopping agent (PID {agent_proc.pid})...")
            # Kill entire process tree to avoid orphan workers
            try:
                parent = psutil.Process(agent_proc.pid)
                for child in parent.children(recursive=True):
                    child.terminate()
                parent.terminate()
                gone, alive = psutil.wait_procs(
                    [parent] + parent.children(recursive=True),
                    timeout=10,
                )
                for p in alive:
                    p.kill()
            except psutil.NoSuchProcess:
                pass
            except Exception:
                agent_proc.terminate()
                try:
                    agent_proc.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    agent_proc.kill()
                    agent_proc.wait()
        agent_proc = None
        agent_running = False
        consecutive_health_failures = 0

    def start_agent():
        nonlocal agent_proc, agent_running, last_start_time, consecutive_health_failures
        agent_proc = run_agent()
        agent_running = True
        last_start_time = time.time()
        consecutive_health_failures = 0
        update_status(client, True, str(agent_proc.pid), "Agent started by supervisor")
        log.info(f"Agent started (PID {agent_proc.pid})")

    def handle_signal(signum, frame):
        log.info(f"Received signal {signum}, shutting down...")
        stop_agent()
        update_status(client, False, logs="Supervisor stopped")
        sys.exit(0)

    signal.signal(signal.SIGTERM, handle_signal)
    signal.signal(signal.SIGINT, handle_signal)

    # Auto-start the agent
    log.info("Supervisor starting - launching agent...")
    start_agent()

    while True:
        time.sleep(POLL_INTERVAL)
        now = time.time()

        # === Check if agent process is still alive ===
        if agent_proc and agent_proc.poll() is not None:
            exit_code = agent_proc.returncode
            log.warning(f"Agent process exited unexpectedly (code {exit_code}) - restarting...")
            agent_proc = None
            agent_running = False
            update_status(client, False, logs=f"Agent crashed (code {exit_code}), restarting...")
            time.sleep(2)
            start_agent()
            continue

        # === Health check: ensure workers are alive ===
        if (agent_running and agent_proc
                and (now - last_start_time) > HEALTH_CHECK_GRACE_PERIOD
                and (now - last_health_check) > HEALTH_CHECK_INTERVAL):
            last_health_check = now
            worker_count = count_worker_children(agent_proc.pid)

            if worker_count == 0:
                consecutive_health_failures += 1
                log.warning(
                    f"Health check: no worker processes found "
                    f"({consecutive_health_failures}/{MAX_CONSECUTIVE_FAILURES})"
                )
                if consecutive_health_failures >= MAX_CONSECUTIVE_FAILURES:
                    log.error("Workers dead - restarting agent...")
                    stop_agent()
                    update_status(client, False, logs="Workers died, restarting...")
                    time.sleep(2)
                    start_agent()
            elif worker_count > 0:
                if consecutive_health_failures > 0:
                    log.info(f"Health check recovered: {worker_count} worker(s) alive")
                consecutive_health_failures = 0

        # === Check for admin commands ===
        command = get_command(client)
        if not command:
            continue

        log.info(f"Received command: {command}")
        clear_command(client)

        if command == "start" and not agent_running:
            start_agent()

        elif command == "stop" and agent_running:
            stop_agent()
            update_status(client, False, logs="Stopped by admin")
            log.info("Agent stopped")

        elif command == "restart":
            stop_agent()
            update_status(client, False, logs="Restarting...")
            time.sleep(1)
            start_agent()


if __name__ == "__main__":
    main()
