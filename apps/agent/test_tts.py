import os
import asyncio
from dotenv import load_dotenv
from livekit.plugins import cartesia

async def test_tts():
    load_dotenv()
    api_key = os.getenv("CARTESIA_API_KEY")
    if not api_key:
        print("❌ CARTESIA_API_KEY missing")
        return

    print("--- Testing Cartesia TTS ---")
    try:
        tts = cartesia.TTS(
            model="sonic-3",
            voice="1463a4e1-56a1-4b41-b257-728d56e93605", # Ludwig voice
            language="en"
        )
        print("✅ Cartesia TTS initialized")
        
        # Test synthetic speech generation
        print("📤 Requesting speech generation...")
        source = tts.synthesize("Hello, I am testing the voice system.")
        async for chunk in source:
            print(f"✅ Received audio chunk: {len(chunk.data)} bytes")
            break # Just need to see if we get anything
        print("✅ Cartesia TTS test successful")
    except Exception as e:
        print(f"❌ Cartesia TTS error: {e}")

if __name__ == "__main__":
    asyncio.run(test_tts())
