import os
import asyncio
from dotenv import load_dotenv

async def check_credentials():
    load_dotenv()
    
    keys = [
        "LIVEKIT_URL",
        "LIVEKIT_API_KEY",
        "LIVEKIT_API_SECRET",
        "DEEPGRAM_API_KEY",
        "BEY_API_KEY",
        "BEY_AVATAR_ID",
        "CARTESIA_API_KEY",
        "OPENROUTER_API_KEY",
        "CONVEX_URL"
    ]
    
    print("--- API Key Check ---")
    for key in keys:
        val = os.getenv(key)
        if val:
            # Mask the key for safety but show it exists
            masked = val[:4] + "*" * (len(val)-8) + val[-4:] if len(val) > 8 else "****"
            print(f"✅ {key}: Found ({masked})")
        else:
            print(f"❌ {key}: MISSING")
            
    print("\n--- Testing Imports ---")
    try:
        from livekit.plugins import deepgram, cartesia, bey
        print("✅ LiveKit Plugins (Deepgram, Cartesia, Bey) imported successfully")
    except Exception as e:
        print(f"❌ Plugin import error: {e}")

if __name__ == "__main__":
    asyncio.run(check_credentials())
