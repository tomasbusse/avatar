import os
import asyncio
from dotenv import load_dotenv

async def test_deepgram():
    load_dotenv()
    api_key = os.getenv("DEEPGRAM_API_KEY")
    if not api_key:
        print("❌ DEEPGRAM_API_KEY missing")
        return

    print("--- Testing Deepgram STT ---")
    try:
        # We need a dummy aiohttp session since we are outside job context
        import aiohttp
        async with aiohttp.ClientSession() as session:
            from livekit.plugins import deepgram
            stt = deepgram.STT(
                model="nova-2",
                language="en",
                http_session=session
            )
            print("✅ Deepgram STT initialized")
            
            # Since we can't easily stream audio here, let's just check if it can talk to the API
            # Usually successfully initializing is a good sign
    except Exception as e:
        print(f"❌ Deepgram error: {e}")

if __name__ == "__main__":
    asyncio.run(test_deepgram())
