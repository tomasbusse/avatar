# 🔭 Sentry Setup Guide for Beethoven Project

**Complete step-by-step guide to integrate Sentry error tracking, performance monitoring, and observability.**

---

## 📋 Prerequisites

- Python 3.11+ installed
- Beethoven project cloned and running
- A Sentry account (free tier works)

---

## Step 1: Create a Sentry Project

### 1.1 Sign up / Log in to Sentry

1. Go to [sentry.io](https://sentry.io)
2. Sign up for a free account or log in

### 1.2 Create a New Project

1. Click **"Create Project"**
2. Select **"Python"** as the platform
3. Name it: `beethoven-agent`
4. Set alert frequency to "Alert me on every new issue" (recommended for development)
5. Click **"Create Project"**

### 1.3 Copy Your DSN

After creating the project, you'll see a **DSN** (Data Source Name):

```
https://abc123@o123456.ingest.sentry.io/1234567
```

**⚠️ COPY THIS DSN** - you'll need it in Step 3!

---

## Step 2: Install Sentry SDK

Navigate to your agent directory and install the Sentry SDK:

```bash
cd /Users/tomas/apps/beethoven/apps/agent

# Activate your virtual environment (if using one)
source venv/bin/activate

# Install sentry-sdk with additional integrations
pip install "sentry-sdk[httpx,aiohttp,logging]>=2.0.0"
```

### Verify Installation

```bash
python -c "import sentry_sdk; print(f'Sentry SDK version: {sentry_sdk.VERSION}')"
```

---

## Step 3: Add Environment Variables

### 3.1 Update your `.env` file

```bash
cd /Users/tomas/apps/beethoven/apps/agent
```

Add these lines to your `.env` file:

```env
# Sentry - Error Tracking & Performance Monitoring
SENTRY_DSN=https://your-dsn@o123456.ingest.sentry.io/1234567
SENTRY_ENVIRONMENT=development
SENTRY_RELEASE=beethoven-agent@1.0.0
```

### 3.2 Environment Values Explained

| Variable | Description | Example |
|----------|-------------|---------|
| `SENTRY_DSN` | Your project's DSN from Step 1.3 | `https://abc@sentry.io/123` |
| `SENTRY_ENVIRONMENT` | Environment name (dev/staging/prod) | `development` |
| `SENTRY_RELEASE` | Version identifier for tracking | `beethoven-agent@1.0.0` |

---

## Step 4: Initialize Sentry in Your Agent

The Beethoven project already has Sentry integration code in `src/monitoring/__init__.py`. 

### 4.1 Add Initialization to main.py

Open `/Users/tomas/apps/beethoven/apps/agent/main.py` and add this at the **top** after the imports:

```python
# Add near the top with other imports
from src.monitoring import get_sentry, BreadcrumbLogger, trace_action

# Add after load_dotenv() but BEFORE any other code
# Initialize Sentry early for maximum coverage
sentry = get_sentry()
sentry.initialize(
    dsn=os.environ.get("SENTRY_DSN"),
    environment=os.environ.get("SENTRY_ENVIRONMENT", "development"),
    release=os.environ.get("SENTRY_RELEASE", "local"),
    traces_sample_rate=1.0,  # 100% in dev, reduce in prod
    profiles_sample_rate=0.5,  # Profile 50% of traces
    integrations=["httpx", "asyncio", "logging"],
)
```

### 4.2 Add Session Context

In the `entrypoint` function, add session context after connecting to the room:

```python
async def entrypoint(ctx: JobContext):
    # ... existing code ...
    
    # After: await ctx.connect(...)
    # Add Sentry context
    sentry = get_sentry()
    sentry.set_context(
        session_id=ctx.room.sid,
        room_name=ctx.room.name,
        avatar_name=avatar_config.get("name", "Unknown"),
    )
```

---

## Step 5: Add Error Boundaries

### 5.1 Wrap Critical Sections

Add try/catch with Sentry capture around critical code:

```python
from src.monitoring import get_sentry, BreadcrumbLogger

async def process_audio(audio_frame):
    sentry = get_sentry()
    try:
        BreadcrumbLogger.user_input("Processing audio frame")
        transcript = await stt.transcribe(audio_frame)
        BreadcrumbLogger.agent_response("stt", transcript)
        return transcript
    except Exception as e:
        sentry.capture_exception(e, context="audio_processing")
        raise
```

### 5.2 Use the @trace_action Decorator

For any action/tool function, use the decorator:

```python
from src.monitoring import trace_action

@trace_action("retrieve_lesson", op="agent.rag")
async def retrieve_lesson(self, lesson_id: str):
    """This automatically tracks timing and errors!"""
    # Your implementation
    pass
```

---

## Step 6: Add Performance Monitoring

### 6.1 Track Latency Metrics

Add spans for each pipeline stage:

```python
from src.monitoring import get_sentry

async def process_turn(user_message: str):
    sentry = get_sentry()
    
    with sentry.start_transaction(name="voice_turn", op="agent.turn") as txn:
        
        # STT Span
        with sentry.start_span(op="stt", description="Speech to Text"):
            transcript = await stt.process(audio)
        
        # LLM Span
        with sentry.start_span(op="llm", description="Generate Response"):
            response = await llm.generate(transcript)
        
        # TTS Span
        with sentry.start_span(op="tts", description="Text to Speech"):
            audio_out = await tts.synthesize(response)
```

### 6.2 Monitor RAG Performance

```python
@trace_action("rag_retrieval", op="agent.rag")
async def search_knowledge_base(query: str):
    BreadcrumbLogger.rag_retrieval(query, num_chunks=0, latency_ms=0)
    
    start = time.time()
    chunks = await rag.search(query)
    latency = (time.time() - start) * 1000
    
    BreadcrumbLogger.rag_retrieval(query, len(chunks), latency)
    return chunks
```

---

## Step 7: Test Your Integration

### 7.1 Create a Test Script

Create `/Users/tomas/apps/beethoven/apps/agent/test_sentry.py`:

```python
#!/usr/bin/env python3
"""Test Sentry integration."""

import os
import asyncio
from dotenv import load_dotenv

load_dotenv()

from src.monitoring import get_sentry, BreadcrumbLogger, trace_action


@trace_action("test_action", op="test")
async def test_action():
    """Test traced action."""
    await asyncio.sleep(0.1)
    return "success"


async def main():
    # Initialize Sentry
    sentry = get_sentry()
    initialized = sentry.initialize(
        dsn=os.environ.get("SENTRY_DSN"),
        environment="test",
        release="test-1.0.0",
        traces_sample_rate=1.0,
    )
    
    if not initialized:
        print("❌ Sentry not initialized - check SENTRY_DSN")
        return
    
    print("✅ Sentry initialized!")
    
    # Set context
    sentry.set_context(
        session_id="test-session-123",
        room_name="test-room",
        avatar_name="TestAvatar",
    )
    
    # Test transaction
    with sentry.start_transaction(name="test_flow", op="test"):
        
        # Test breadcrumbs
        BreadcrumbLogger.user_input("Test user input")
        
        # Test traced action
        await test_action()
        
        BreadcrumbLogger.agent_response("text", "Test response")
        
        # Test error capture (caught exception)
        try:
            raise ValueError("Test error for Sentry!")
        except ValueError as e:
            event_id = sentry.capture_exception(e, test_context="manual test")
            print(f"📨 Captured test error: {event_id}")
    
    print("✅ Test complete! Check your Sentry dashboard.")
    
    # Give Sentry time to send events
    await asyncio.sleep(2)


if __name__ == "__main__":
    asyncio.run(main())
```

### 7.2 Run the Test

```bash
cd /Users/tomas/apps/beethoven/apps/agent
python test_sentry.py
```

### 7.3 Verify in Sentry Dashboard

1. Go to [sentry.io](https://sentry.io)
2. Open your `beethoven-agent` project
3. Check **Issues** - you should see the test error
4. Check **Performance** - you should see the test transaction

---

## Step 8: Configure Alerts (Optional)

### 8.1 Set Up Slack Integration

1. In Sentry, go to **Settings > Integrations**
2. Install the **Slack** integration
3. Connect your workspace

### 8.2 Create Alert Rules

1. Go to **Alerts > Create Alert**
2. Create these recommended alerts:

**High Latency Alert:**
- Condition: `p99(transaction.duration) > 2000ms`
- Frequency: Every 5 minutes
- Action: Notify Slack

**Error Spike Alert:**
- Condition: `Error count > 10 in 5 minutes`
- Action: Notify Slack + Email

---

## 📊 What You Get

After completing this setup:

✅ **Error Tracking** - All exceptions automatically captured
✅ **Performance Monitoring** - Trace latency across STT → LLM → TTS
✅ **Breadcrumbs** - Conversation flow logged for debugging
✅ **Session Context** - Errors linked to specific rooms/users
✅ **Distributed Tracing** - See the full request lifecycle

---

## 🔧 Troubleshooting

### "SENTRY_DSN not set"

Make sure your `.env` file has the DSN and is being loaded:
```bash
source .env
echo $SENTRY_DSN
```

### Events Not Appearing

1. Check your DSN is correct
2. Ensure `traces_sample_rate` is > 0
3. Wait 1-2 minutes (events are batched)

### Import Errors

```bash
pip install "sentry-sdk[httpx,aiohttp,logging]>=2.0.0"
```

---

## 📚 Next Steps

1. **Read the BEADS config**: Check `beads.yaml` for signal configuration
2. **Add custom metrics**: Track business-specific metrics
3. **Set up Source Maps**: For frontend error tracking
4. **Configure Releases**: Auto-deploy release tracking

---

*Built with the BEADS methodology - see `BEADS-METHODOLOGY.md` for more.*
