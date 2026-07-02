"""
Regression test for the landing-agent "no speech" bug: a plain
STT+LLM+TTS AgentSession never speaks first on its own (unlike Gemini
Live), so run_landing_agent must explicitly trigger an opening greeting
via session.generate_reply() after session.start(), or the avatar sits
silently waiting for the visitor to speak first.

No pytest in this venv — plain asyncio + unittest.mock, matching this
repo's existing test_*.py convention (test_tts.py, test_stt.py).
"""

import asyncio
import json
import sys
from unittest.mock import AsyncMock, MagicMock, patch

# Some livekit plugins (bithuman is compiled/license-gated; google may be an
# optional extra) aren't installed in every dev venv — stub whichever are
# missing so this test can run without hitting the network/install.
for _plugin in ("bithuman", "google"):
    try:
        __import__(f"livekit.plugins.{_plugin}")
    except ImportError:
        sys.modules[f"livekit.plugins.{_plugin}"] = MagicMock()

from src.agents import landing_agent


def _make_ctx(metadata: dict) -> MagicMock:
    ctx = MagicMock()
    ctx.connect = AsyncMock()
    ctx.room.name = "landing-test-room"
    ctx.room.metadata = json.dumps(metadata)
    ctx.job = None
    return ctx


async def test_generate_reply_called_after_session_start():
    ctx = _make_ctx({
        "avatarName": "George Patterson",
        "voiceProvider": {
            "type": "cartesia",
            "model": "sonic-3",
            "voiceId": "95856005-0332-41b0-935f-352e296aa0df",
            "language": "en",
        },
    })

    fake_session = MagicMock()
    fake_session.start = AsyncMock()
    call_order = []
    fake_session.start.side_effect = lambda *a, **kw: call_order.append("start")

    reply_handle = AsyncMock()
    def _generate_reply(*a, **kw):
        call_order.append("generate_reply")
        return reply_handle()
    fake_session.generate_reply = MagicMock(side_effect=_generate_reply)

    fake_avatar = MagicMock()
    fake_avatar.start = AsyncMock()

    with patch.object(landing_agent, "_build_cartesia_session", return_value=fake_session), \
         patch.object(landing_agent.bithuman, "AvatarSession", return_value=fake_avatar), \
         patch("asyncio.sleep", AsyncMock()):
        await landing_agent.run_landing_agent(ctx)

    assert fake_session.start.await_count == 1, "session.start must be called"
    assert fake_session.generate_reply.call_count == 1, (
        "run_landing_agent must trigger an opening greeting via "
        "session.generate_reply — a plain STT+LLM+TTS session never "
        "speaks first on its own"
    )
    assert call_order == ["start", "generate_reply"], (
        "generate_reply must run AFTER session.start, not before"
    )
    print("✅ test_generate_reply_called_after_session_start passed")


if __name__ == "__main__":
    asyncio.run(test_generate_reply_called_after_session_start())
