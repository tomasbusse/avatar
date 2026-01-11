#!/usr/bin/env python3
"""Test Sentry integration for Beethoven Agent."""

import os
import asyncio
from dotenv import load_dotenv

load_dotenv()

from src.monitoring import get_sentry, BreadcrumbLogger


async def main():
    # Initialize Sentry
    sentry = get_sentry()
    initialized = sentry.initialize(
        dsn=os.environ.get("SENTRY_DSN"),
        environment="test",
        release="beethoven-agent@test",
        traces_sample_rate=1.0,
    )
    
    if not initialized:
        print("❌ Sentry not initialized - check SENTRY_DSN in .env")
        print(f"   Current value: {os.environ.get('SENTRY_DSN', 'NOT SET')[:50]}...")
        return
    
    print("✅ Sentry initialized!")
    
    # Set context (simulating a session)
    sentry.set_context(
        session_id="test-session-123",
        room_name="test-room",
        avatar_name="Emma",
    )
    print("✅ Context set!")
    
    # Test transaction with spans
    with sentry.start_transaction(name="test_voice_turn", op="agent.turn"):
        
        # Simulate STT
        BreadcrumbLogger.user_input("Hello, can you help me learn English?")
        print("✅ Breadcrumb logged: user input")
        
        # Simulate LLM
        await asyncio.sleep(0.1)
        BreadcrumbLogger.agent_response("text", "Of course! What would you like to practice today?")
        print("✅ Breadcrumb logged: agent response")
        
        # Simulate RAG
        BreadcrumbLogger.rag_retrieval("english greetings", num_chunks=3, latency_ms=45.2)
        print("✅ Breadcrumb logged: RAG retrieval")
        
        # Test error capture
        try:
            raise ValueError("Test error for Sentry - please ignore!")
        except ValueError as e:
            event_id = sentry.capture_exception(e, test_context="integration_test")
            print(f"✅ Test error captured: {event_id}")
    
    print("\n" + "="*50)
    print("🎉 All tests passed!")
    print("="*50)
    print("\n📊 Check your Sentry dashboard in ~1 minute:")
    print("   → Issues: You should see 'ValueError: Test error for Sentry'")
    print("   → Performance: You should see 'test_voice_turn' transaction")
    print("\n⏳ Waiting 3 seconds for events to send...")
    await asyncio.sleep(3)
    print("✅ Done!")


if __name__ == "__main__":
    asyncio.run(main())
