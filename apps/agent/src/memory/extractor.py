"""
Memory Extraction Module

Extracts facts and generates summaries from conversation transcripts.
Uses LLM to identify memorable information about the student.
"""

import json
import logging
from typing import Dict, Any, List, Optional
import httpx

logger = logging.getLogger("memory-extractor")

# Memory types we extract
MEMORY_TYPES = {
    "personal_fact": "Personal information about the student (name, job, family, hobbies)",
    "preference": "Learning preferences, communication style, interests",
    "struggle": "Topics or concepts the student struggles with",
    "achievement": "Accomplishments, progress milestones, things they did well",
    "goal": "Learning goals, career aspirations, reasons for learning",
    "interest": "Topics they're interested in or excited about",
    "emotional": "Emotional states, frustrations, motivations",
    "upcoming": "Future events the student mentioned (holiday, meeting, exam, trip, etc.)",
}

EXTRACTION_PROMPT = """You are analyzing a conversation between a language teacher and a student.
Extract memorable facts that would help personalize future sessions.

Today's date: {today_date}

IMPORTANT: Only extract facts that are:
1. Specific to THIS student (not general knowledge)
2. Useful for future personalization
3. Clearly stated or strongly implied in the conversation

For each fact, provide:
- type: one of [personal_fact, preference, struggle, achievement, goal, interest, emotional, upcoming]
- content: the fact in a concise sentence
- importance: critical (must remember), high (very useful), medium (nice to know), low (minor detail)
- event_date: (ONLY for "upcoming" type) ISO date string when the event occurs (e.g., "2024-12-25")

SPECIAL: For "upcoming" type, extract any future events the student mentions:
- Holidays/vacations ("I'm going on holiday next week", "My vacation starts Monday")
- Meetings/presentations ("I have a presentation next Thursday")
- Exams ("My exam is on the 15th")
- Personal events ("My birthday is next month", "Wedding anniversary coming up")

Return JSON array of facts. If no memorable facts, return empty array [].

Example output:
[
  {{"type": "personal_fact", "content": "Works as a software engineer at BMW", "importance": "high"}},
  {{"type": "struggle", "content": "Has difficulty with past perfect tense", "importance": "critical"}},
  {{"type": "upcoming", "content": "Going on holiday to Spain", "importance": "high", "event_date": "2024-12-20"}}
]

CONVERSATION TRANSCRIPT:
{transcript}

Extract facts (JSON array only, no explanation):"""

SUMMARY_PROMPT = """Summarize this language learning session in 2-3 sentences.
Focus on: what was covered, how the student performed, and any notable moments.

Keep it concise and useful for future reference.

CONVERSATION:
{transcript}

SUMMARY:"""


async def extract_facts_from_transcript(
    transcript: List[Dict[str, str]],
    api_key: str,
    model: str = "anthropic/claude-3-haiku",
) -> List[Dict[str, Any]]:
    """
    Extract memorable facts from a conversation transcript using LLM.

    Args:
        transcript: List of {"role": "user"|"assistant", "content": str}
        api_key: OpenRouter API key
        model: LLM model to use (haiku for speed/cost)

    Returns:
        List of extracted facts with type, content, importance, and optional event_date
    """
    from datetime import datetime

    if not transcript or len(transcript) < 2:
        logger.info("Transcript too short for fact extraction")
        return []

    # Format transcript for prompt
    formatted = "\n".join([
        f"{'Student' if m['role'] == 'user' else 'Teacher'}: {m['content']}"
        for m in transcript[-50:]  # Last 50 messages max
    ])

    today = datetime.now().strftime("%Y-%m-%d")
    prompt = EXTRACTION_PROMPT.format(transcript=formatted, today_date=today)

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 1000,
                    "temperature": 0.3,
                },
            )

            if response.status_code != 200:
                logger.error(f"LLM error: {response.status_code} - {response.text}")
                return []

            data = response.json()
            content = data["choices"][0]["message"]["content"].strip()

            # Parse JSON response
            # Handle markdown code blocks
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]

            facts = json.loads(content)

            # Validate structure
            valid_facts = []
            for fact in facts:
                if all(k in fact for k in ["type", "content", "importance"]):
                    if fact["type"] in MEMORY_TYPES:
                        valid_facts.append(fact)

            logger.info(f"🧠 Extracted {len(valid_facts)} facts from transcript")
            return valid_facts

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse LLM response as JSON: {e}")
        return []
    except Exception as e:
        logger.error(f"Fact extraction failed: {e}")
        return []


async def generate_session_summary(
    transcript: List[Dict[str, str]],
    api_key: str,
    model: str = "anthropic/claude-3-haiku",
) -> Optional[str]:
    """
    Generate a brief summary of the session.

    Args:
        transcript: List of {"role": "user"|"assistant", "content": str}
        api_key: OpenRouter API key
        model: LLM model to use

    Returns:
        Summary string or None if failed
    """
    if not transcript or len(transcript) < 4:
        logger.info("Transcript too short for summary")
        return None

    # Format transcript
    formatted = "\n".join([
        f"{'Student' if m['role'] == 'user' else 'Teacher'}: {m['content']}"
        for m in transcript[-30:]  # Last 30 messages for summary
    ])

    prompt = SUMMARY_PROMPT.format(transcript=formatted)

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 200,
                    "temperature": 0.3,
                },
            )

            if response.status_code != 200:
                logger.error(f"LLM error: {response.status_code}")
                return None

            data = response.json()
            summary = data["choices"][0]["message"]["content"].strip()

            logger.info(f"📝 Generated session summary: {summary[:100]}...")
            return summary

    except Exception as e:
        logger.error(f"Summary generation failed: {e}")
        return None


async def process_session_end(
    transcript: List[Dict[str, str]],
    student_id: str,
    session_id: Optional[str],
    avatar_slug: str,
    convex_client: "ConvexClient",
    api_key: str,
) -> Dict[str, Any]:
    """
    Process end of session: extract facts and generate summary.

    Args:
        transcript: Conversation messages
        student_id: Student identifier
        session_id: Session ID (optional)
        avatar_slug: Avatar identifier
        convex_client: Convex client for storing memories
        api_key: OpenRouter API key

    Returns:
        Dict with extracted_facts count and summary
    """
    logger.info(f"🧠 Processing session end for student {student_id}")

    results = {
        "extracted_facts": 0,
        "summary": None,
        "errors": [],
    }

    # Extract facts
    try:
        facts = await extract_facts_from_transcript(transcript, api_key)

        # Store each fact as a memory
        for fact in facts:
            # Parse event_date for upcoming type memories
            event_date_ts = None
            if fact["type"] == "upcoming" and fact.get("event_date"):
                try:
                    from datetime import datetime
                    event_dt = datetime.fromisoformat(fact["event_date"])
                    event_date_ts = int(event_dt.timestamp() * 1000)  # Convert to milliseconds
                except (ValueError, TypeError) as e:
                    logger.warning(f"Failed to parse event_date: {e}")

            memory_id = await convex_client.create_memory(
                student_id=student_id,
                memory_type=fact["type"],
                content=fact["content"],
                importance=fact["importance"],
                session_id=session_id,
                avatar_slug=avatar_slug,
                event_date=event_date_ts,
            )
            if memory_id:
                results["extracted_facts"] += 1

        logger.info(f"✅ Stored {results['extracted_facts']} memories")

    except Exception as e:
        logger.error(f"Fact extraction error: {e}")
        results["errors"].append(f"fact_extraction: {e}")

    # Generate and store session summary
    try:
        summary = await generate_session_summary(transcript, api_key)

        if summary:
            await convex_client.create_memory(
                student_id=student_id,
                memory_type="session_summary",
                content=summary,
                importance="medium",
                session_id=session_id,
                avatar_slug=avatar_slug,
            )
            results["summary"] = summary
            logger.info(f"✅ Stored session summary")

    except Exception as e:
        logger.error(f"Summary generation error: {e}")
        results["errors"].append(f"summary: {e}")

    return results
